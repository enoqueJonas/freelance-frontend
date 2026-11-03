import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const password = process.env.E2E_PASSWORD;
if (!password) throw new Error('E2E_PASSWORD must be supplied by isolated CI');

const employerName = 'empregador_d54';
const workerName = 'trabalhador_d54';

async function register(page: Page, username: string, name: string, email: string, phone: string) {
  await page.goto('/#/real');
  await page.getByRole('button', { name: 'Criar conta real' }).click();
  await page.getByLabel('Nome completo').fill(name);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Telefone moçambicano').fill(phone);
  await page.getByLabel('Nome de utilizador').fill(username);
  await page.getByLabel('Palavra-passe').fill(password as string);
  await page.getByRole('button', { name: 'Registar e iniciar sessão' }).click();
  await expect(page.getByText('Sessão real iniciada.', { exact: false })).toBeVisible();
}

async function signOut(page: Page) {
  await page.getByRole('button', { name: 'Sair / Trocar de conta' }).click();
  await expect(page.getByRole('button', { name: 'Entrar com JWT real' })).toBeVisible();
}

async function logIn(page: Page, username: string) {
  await page.getByLabel('Nome de utilizador').fill(username);
  await page.getByLabel('Palavra-passe').fill(password as string);
  await page.getByRole('button', { name: 'Entrar com JWT real' }).click();
  await expect(page.getByText('Sessão real iniciada.', { exact: false })).toBeVisible();
}

async function selectContract(page: Page, state?: string) {
  const pattern = state
    ? new RegExp('Contratação #[0-9]+ · ' + state)
    : /Contratação #[0-9]+/;
  await page.getByRole('button', { name: pattern }).first().click();
}

async function submitVersion(page: Page, scope: string, amount: string) {
  await page.getByPlaceholder('Âmbito e entregáveis acordados').fill(scope);
  await page.getByPlaceholder('Valor em MZN').fill(amount);
  await page.getByRole('button', { name: 'Submeter versão' }).click();
  await expect(page.getByText('Nova versão do acordo proposta.')).toBeVisible();
}

async function acceptVersion(page: Page, number: number) {
  await page.getByRole('checkbox', {
    name: /Confirmo que li esta versão e pretendo aceitá-la/,
  }).check();
  await page.getByRole('button', { name: 'Aceitar versão v' + number }).click();
  await expect(page.getByText('Aceitação registada na API.')).toBeVisible();
}

test('D54: two JWT users, real opportunity, proposal, v1 and v2 agreements', async ({ page }) => {
  mkdirSync('artifacts/d54', { recursive: true });
  await register(page, employerName, 'Empregador D54', 'employer.d54@example.test', '84 123 4567');
  await page.getByPlaceholder('Nome da empresa').fill('Empresa D54');
  await page.getByPlaceholder('Localização').fill('Maputo');
  await page.locator('form:has(input[placeholder="Nome da empresa"])').getByRole('button', { name: 'Criar perfil' }).click();
  await expect(page.getByText('Perfil de empregador criado.')).toBeVisible();

  await page.getByPlaceholder('Título').fill('Portal institucional D54');
  await page.getByPlaceholder('Descrição').fill('Desenvolvimento web e revisão.');
  await page.getByRole('button', { name: 'Criar', exact: true }).click();
  await expect(page.getByText('Oportunidade guardada como rascunho.')).toBeVisible();
  await page.getByRole('button', { name: 'Publicar', exact: true }).click();
  await expect(page.getByText('Oportunidade publicada.')).toBeVisible();
  await page.screenshot({ path: 'artifacts/d54/01-oportunidade-publicada.png', fullPage: true });

  await signOut(page);
  await register(page, workerName, 'Trabalhador D54', 'worker.d54@example.test', '82 123 4567');
  await page.getByPlaceholder('Competências: Django, React...').fill('Django');
  await page.getByPlaceholder('Experiência profissional').fill('2 anos');
  await page.locator('form:has(input[placeholder="Competências: Django, React..."])').getByRole('button', { name: 'Criar perfil' }).click();
  await expect(page.getByText('Perfil de trabalhador criado.')).toBeVisible();

  await page.getByPlaceholder('Descreva a proposta').fill('Posso implementar o portal.');
  await page.getByRole('button', { name: 'Propor', exact: true }).click();
  await expect(page.getByText('Proposta submetida ao empregador.')).toBeVisible();
  await expect(page.getByText('Proposta submetida · SUBMITTED')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Propor', exact: true })).toHaveCount(0);
  await expect(page.getByText(/Proposta #[0-9]+: SUBMITTED/)).toBeVisible();
  await page.screenshot({ path: 'artifacts/d54/02-proposta-submetida.png', fullPage: true });

  // State must come from Django after changing account, not an ephemeral UI flag.
  await signOut(page);
  await logIn(page, workerName);
  await expect(page.getByText('Proposta submetida · SUBMITTED')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Propor', exact: true })).toHaveCount(0);
  await signOut(page);
  await logIn(page, employerName);
  await page.getByRole('button', { name: 'Aceitar proposta' }).click();
  await expect(page.getByText('Proposta aceite; contratação pendente criada.')).toBeVisible();
  await selectContract(page, 'PENDING_AGREEMENT');
  await page.screenshot({ path: 'artifacts/d54/03-contratacao-pendente.png', fullPage: true });

  await submitVersion(page, 'v1: portal institucional', '25000.00');
  await acceptVersion(page, 1);
  await expect(page.getByRole('button', { name: /Contratação #[0-9]+ · PENDING_AGREEMENT/ })).toBeVisible();

  await signOut(page);
  await logIn(page, workerName);
  // The opportunity is now CLOSED: own ACCEPTED proposal must remain visible.
  await expect(page.getByText(/Proposta #[0-9]+: ACCEPTED · Oportunidade: CLOSED/)).toBeVisible();
  await selectContract(page, 'PENDING_AGREEMENT');
  await acceptVersion(page, 1);
  await expect(page.getByRole('button', { name: /Contratação #[0-9]+ · ACTIVE/ })).toBeVisible();
  await page.screenshot({ path: 'artifacts/d54/04-acordo-v1-activo.png', fullPage: true });

  await submitVersion(page, 'v2: portal e manutenção', '30000.00');
  await expect(page.getByText('Vigente', { exact: true })).toBeVisible();
  await acceptVersion(page, 2);
  await expect(page.getByText('Vigente', { exact: true })).toBeVisible();

  await signOut(page);
  await logIn(page, employerName);
  await selectContract(page, 'ACTIVE');
  await acceptVersion(page, 2);
  await expect(page.getByText('SUPERSEDED', { exact: true })).toBeVisible();
  await expect(page.getByText('ACCEPTED', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'artifacts/d54/05-versao-v2-vigente.png', fullPage: true });

  await submitVersion(page, 'v3: condições alternativas', '31000.00');
  await signOut(page);
  await logIn(page, workerName);
  await selectContract(page, 'ACTIVE');
  await page.getByPlaceholder('Motivo da rejeição').fill('Novo valor não aceite');
  await page.getByRole('button', { name: 'Rejeitar' }).click();
  await expect(page.getByText('Alteração rejeitada, acordo anterior preservado.')).toBeVisible();
  await expect(page.getByText('REJECTED', { exact: true })).toBeVisible();
  await expect(page.getByText('Vigente', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'artifacts/d54/06-versao-v3-rejeitada.png', fullPage: true });
});
