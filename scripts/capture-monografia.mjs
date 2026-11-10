import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE = 'http://127.0.0.1:3000/';
const OUT = process.env.SCREENSHOT_DIR || 'capturas-monografia';
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  locale: 'pt-PT',
  timezoneId: 'Africa/Maputo',
  colorScheme: 'light',
  reducedMotion: 'reduce',
});
const page = await context.newPage();
page.setDefaultTimeout(12000);
const errors = [];
page.on('pageerror', err => errors.push(err.message));

const goto = async (route, waitText) => {
  await page.goto(BASE + '#' + route, { waitUntil: 'networkidle' });
  if (waitText) {
    await page.getByText(waitText, { exact: false }).first().waitFor({ state: 'visible' });
  }
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(350);
};
const captures = [];
const snap = async (file, title, route, locator = null, waitText = null, note = '') => {
  if (route) await goto(route, waitText);
  if (locator) {
    const el = page.locator(locator).first();
    await el.waitFor({ state: 'visible' });
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await el.screenshot({
      path: path.join(OUT, file), animations: 'disabled',
      timeout: 30000,
    });
  } else {
    await page.screenshot({
      path: path.join(OUT, file), fullPage: true,
      animations: 'disabled', timeout: 30000,
    });
  }
  captures.push({ file, title, route: route || page.url(), note });
  console.log('CAPTURA', file, title);
};

await goto('/', null);
// The app initializes its own demonstration data. Extend those records with
// SYNTHETIC contracts, agreements, payments and conflicts for reproducible screens.
const fixture = await page.evaluate(() => {
  const get = key => JSON.parse(localStorage.getItem(key) || '[]');
  const put = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const users = get('serviplus_users');
  const workers = get('serviplus_workers');
  const employers = get('serviplus_employers');
  const worker = users.find(u => u.id === 1);
  const employer = users.find(u => u.id === 4);
  const admin = users.find(u => u.role === 'admin');
  const workerProfile = workers.find(w => w.userId === worker.id);
  const employerProfile = employers.find(e => e.userId === employer.id);
  if (!worker || !employer || !admin || !workerProfile || !employerProfile) {
    throw new Error('Dados sintéticos base não encontrados');
  }
  worker.roles = ['worker', 'employer'];
  employers.push({
    ...employerProfile,
    id: 990,
    userId: worker.id,
    companyName: 'Consultoria de Demonstração',
    contactName: worker.first_name + ' ' + worker.last_name,
    email: worker.email,
    documentStatus: 'unsubmitted'
  });
  const contract = {
    id: 900,
    proposalId: 900,
    offerId: 900,
    employerId: employer.id,
    workerId: workerProfile.id,
    employerProfile,
    workerProfile,
    title: 'Portal de Serviços TI — Demonstração',
    description: 'Desenvolvimento de um portal web de serviços tecnológicos, com consulta de oportunidades, gestão de propostas e mensagens.',
    budget: 48000,
    startDate: '2026-11-05',
    endDate: '2026-12-20',
    status: 'active',
    createdAt: '2026-11-05T09:00:00Z',
    signedByEmployer: true,
    signedByWorker: true
  };
  const terms = {
    title: contract.title,
    scope: contract.description,
    deliverables: 'Código-fonte, documentação técnica, testes de aceitação e demonstração funcional.',
    acceptanceCriteria: 'Fluxos de registo, pesquisa, proposta e notificação executados com sucesso no ambiente de demonstração.',
    budget: contract.budget,
    startDate: contract.startDate,
    endDate: contract.endDate,
    paymentConditions: [
      { id: 'advance', stage: 'ADVANCE', method: 'M-Pesa', amount: 12000, moment: 'Após aceitação bilateral do acordo' },
      { id: 'milestone_1', stage: 'MILESTONE', method: 'Transferência Bancária', amount: 24000, moment: 'Após validação da primeira entrega' },
      { id: 'final', stage: 'FINAL', method: 'e-Mola', amount: 12000, moment: 'Após aceitação da entrega final' }
    ]
  };
  const event = (action, actorUserId, at, note) => ({ action, actorUserId, at, note });
  const approved = {
    id: 900, contractId: 900, number: 1, status: 'ACTIVE',
    createdByUserId: employer.id, createdAt: '2026-11-05T09:00:00Z',
    reason: 'Formalização inicial das condições do serviço.',
    terms,
    approvals: [
      { party: 'employer', userId: employer.id, approvedAt: '2026-11-05T10:00:00Z' },
      { party: 'worker', userId: worker.id, approvedAt: '2026-11-05T11:00:00Z' }
    ],
    events: [
      event('CREATED', employer.id, '2026-11-05T09:00:00Z', 'Rascunho inicial'),
      event('SUBMITTED', employer.id, '2026-11-05T09:45:00Z', 'Versão publicada'),
      event('APPROVED', employer.id, '2026-11-05T10:00:00Z', 'Aceite pelo empregador'),
      event('APPROVED', worker.id, '2026-11-05T11:00:00Z', 'Aceite pelo trabalhador'),
      event('ACTIVATED', worker.id, '2026-11-05T11:00:00Z', 'Acordo em vigor')
    ]
  };
  const amendedTerms = structuredClone(terms);
  amendedTerms.deliverables = 'Código-fonte, documentação, testes de aceitação, dashboard de métricas e demonstração funcional.';
  const amended = {
    id: 901, contractId: 900, number: 2, status: 'PENDING_APPROVAL',
    createdByUserId: employer.id, createdAt: '2026-11-09T08:00:00Z',
    submittedAt: '2026-11-09T09:00:00Z',
    reason: 'Proposta de incluir um dashboard de acompanhamento.',
    terms: amendedTerms,
    approvals: [
      { party: 'employer', userId: employer.id, approvedAt: '2026-11-09T10:00:00Z' }
    ],
    events: [
      event('CREATED', employer.id, '2026-11-09T08:00:00Z', 'Proposta de aditamento'),
      event('SUBMITTED', employer.id, '2026-11-09T09:00:00Z', 'Versão submetida à apreciação'),
      event('APPROVED', employer.id, '2026-11-09T10:00:00Z', 'Aceite pelo empregador')
    ]
  };
  const payment = {
    id: 900, contractId: 900, agreementVersionId: 900, agreementConditionId: 'advance',
    amount: 12000, method: 'M-Pesa', stage: 'ADVANCE',
    moment: 'Após aceitação bilateral do acordo',
    paidOn: '2026-11-06',
    externalReference: 'REF-EXEMPLO-001',
    notes: 'Registo sintético para demonstração académica.',
    status: 'REPORTED_PAID', reportedByUserId: employer.id,
    createdAt: '2026-11-06T12:00:00Z', updatedAt: '2026-11-06T12:00:00Z',
    history: [
      { status: 'REPORTED_PAID', actorUserId: employer.id, recordedAt: '2026-11-06T12:00:00Z',
        note: 'Pagamento declarado pelo empregador; sem verificação bancária.' }
    ]
  };
  const dispute = {
    id: 900, contractId: 900, employerUserId: employer.id,
    workerUserId: worker.id, reportedByUserId: worker.id,
    category: 'DELIVERABLE',
    description: 'O primeiro protótipo entregue não inclui o relatório de testes combinado.',
    status: 'WAITING_INFORMATION', requestedFromUserId: worker.id,
    evidence: [
      { id: 1, authorUserId: worker.id, description: 'Registo de demonstração do relatório de testes em falta.',
        createdAt: '2026-11-08T09:00:00Z' }
    ],
    events: [
      { id: 1, action: 'REPORTED', actorUserId: worker.id, recordedAt: '2026-11-08T09:00:00Z',
        note: 'Ocorrência comunicada', statusAfter: 'OPEN' },
      { id: 2, action: 'REVIEW_STARTED', actorUserId: admin.id, recordedAt: '2026-11-08T10:00:00Z',
        note: 'Análise administrativa documental iniciada', statusAfter: 'UNDER_REVIEW' },
      { id: 3, action: 'INFORMATION_REQUESTED', actorUserId: admin.id, recordedAt: '2026-11-09T09:00:00Z',
        note: 'Solicitado relatório de testes', statusAfter: 'WAITING_INFORMATION' }
    ],
    createdAt: '2026-11-08T09:00:00Z', updatedAt: '2026-11-09T09:00:00Z'
  };
  put('serviplus_users', users);
  put('serviplus_employers', employers);
  put('serviplus_contracts', [contract, ...get('serviplus_contracts').filter(c => c.id !== 900)]);
  put('conecta_agreement_versions_v1', [approved, amended]);
  put('serviplus_payments', [payment]);
  const reportOpen = {
    ...dispute,
    id: 901,
    category: 'COMMUNICATION',
    description: 'As partes solicitam clarificação sobre a data da reunião técnica.',
    status: 'OPEN',
    requestedFromUserId: undefined,
    reportedByUserId: employer.id,
    evidence: [{ id: 1, authorUserId: employer.id,
      description: 'Histórico sintético das mensagens de agendamento.',
      createdAt: '2026-11-09T14:00:00Z' }],
    events: [{ id: 1, action: 'REPORTED', actorUserId: employer.id,
      recordedAt: '2026-11-09T14:00:00Z',
      note: 'Reporte apresentado para acompanhamento administrativo', statusAfter: 'OPEN' }],
    createdAt: '2026-11-09T14:00:00Z', updatedAt: '2026-11-09T14:00:00Z'
  };
  put('conecta_disputes_v1', [reportOpen, dispute]);
  put('serviplus_session_user', 'null');
  return { workerId: worker.id, employerId: employer.id, adminId: admin.id, workerEmail: worker.email, employerEmail: employer.email };
});
const setSession = async (userId, role) => {
  await page.evaluate(({userId,role}) => {
    const users = JSON.parse(localStorage.getItem('serviplus_users') || '[]');
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('Conta sintética desconhecida');
    localStorage.setItem('serviplus_session_user',
      JSON.stringify({ ...user, role }));
  }, {userId, role});
  // HashRouter may not reload the React authentication context on hash changes.
  // Force a document reload so AuthProvider reads the synthetic localStorage session.
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(350);
};

await snap('01-pagina-inicial.png', 'Página inicial da plataforma ConecTA', '/', null,
  null, 'Vista pública: pesquisa e apresentação da plataforma.');
await snap('02-registo-trabalhador.png', 'Formulário de registo de trabalhador autónomo',
  '/register?role=worker', null, 'Registe uma nova conta');
await snap('03-registo-empregador.png', 'Formulário de registo de empregador',
  '/register?role=employer', null, 'Registe uma nova conta');
await snap('04-pesquisa-oportunidades.png', 'Pesquisa e filtragem de oportunidades',
  '/offers', null, 'Projectos');
await snap('05-pesquisa-profissionais.png', 'Pesquisa e filtragem de profissionais',
  '/workers', null, null);
await snap('06-acesso-prototipo.png', 'Acesso à conta na versão demonstrativa',
  '/login', null, 'Aceder à sua conta',
  'Acesso simulado sem palavra-passe. Não utilizar como evidência de segurança ou autenticação.');

await setSession(fixture.workerId, 'worker');
await snap('07-painel-trabalhador.png', 'Painel do trabalhador autónomo',
  '/dashboard', null, 'Os meus perfis');
await snap('08-perfil-profissional.png', 'Perfil público do profissional de TI',
  '/profile/1?role=worker', null, 'Resumo Profissional');

await setSession(fixture.employerId, 'employer');
await snap('09-painel-empregador.png', 'Painel do empregador',
  '/dashboard', null, 'Os meus perfis');
await page.getByRole('button', { name: /Contratos & Estágio/ }).click();
await page.locator('[aria-label="Acordos e versões"]').first().waitFor({ state: 'visible' });
await snap('10-gestao-contratos.png', 'Visão de contratos e acompanhamento',
  null, 'div.max-w-4xl', null, 'Recorte do módulo de contratos no painel do empregador.');
await snap('11-acordo-versoes.png', 'Versão aceite e proposta de alteração do acordo',
  null, '[aria-label="Acordos e versões"]', null,
  'Versão 1 ativa; versão 2 aguarda aceitação do trabalhador, ambas sintéticas.');
await page.getByRole('button', { name: 'Registar pagamento realizado fora da plataforma' }).click();
await snap('12-pagamentos-externos.png', 'Registo e acompanhamento declarativo de pagamentos externos',
  null, '[aria-label="Acompanhamento de pagamentos externos"]', null,
  'Não representa transferência, custódia nem confirmação financeira.');
const disputePanel = page.locator('[aria-label="Reporte e acompanhamento de conflitos"]').first();
await disputePanel.locator('summary').first().click();
await disputePanel.locator('summary').nth(1).click();
await snap('13-conflitos-contrato.png', 'Reporte e acompanhamento de conflitos associados ao contrato',
  null, '[aria-label="Reporte e acompanhamento de conflitos"]', null,
  'Acompanhamento administrativo sem poderes arbitrais.');

await setSession(fixture.adminId, 'admin');
await snap('14-painel-administrador.png', 'Visão geral do administrador',
  '/dashboard', null, 'Moderação de BI');
await page.getByRole('button', { name: /Moderação de BI/ }).click();
const adminDisputes = page.locator('[aria-label="Gestão administrativa de conflitos"]').first();
await adminDisputes.locator('summary').first().click();
await snap('15-moderacao-conflitos.png', 'Acompanhamento administrativo de ocorrências',
  null, '[aria-label="Gestão administrativa de conflitos"]', null,
  'A administração regista eventos e pedidos de informação, sem decidir direitos contratuais.');

const readme = [
  '# Capturas de ecrã — Protótipo ConecTA',
  '',
  '**Origem:** frontend React, branch de capturas \`design/conecta-petrol-v1\`, derivada da implementação não integrada do PR #12.',
  '**Ambiente:** navegador Chromium, 1440×900 CSS px, escala 2×, fuso Africa/Maputo, dados exclusivamente sintéticos.',
  '**Natureza:** capturas de uma execução demonstrativa, não provas de validação de requisitos de segurança, de integração com Django ou de testes com utilizadores.',
  '',
  '| Ficheiro | Legenda sugerida | Notas |',
  '|---|---|---|',
  ...captures.map((c, i) =>
    `| ${c.file} | Figura X.${i+1} — ${c.title} | ${c.note || 'Protótipo demonstrativo'} |`
  ),
  '',
  '## Regras de uso académico',
  '',
  '- Não identificar estas imagens como resultado de testes de aceitação dos utilizadores.',
  '- As telas refletem um sistema com persistência \`localStorage\`; não comprovam autenticação ou autorização do backend.',
  '- O fluxo de pagamentos é declarativo; não existe custódia nem transferência de fundos.',
  '- A gestão de conflitos é apenas documental; não há arbitragem vinculativa.',
  '- A versão 2 do acordo e a ocorrência administrativa foram inseridas com dados fictícios para mostrar os estados da interface.',
  '- Rever o capítulo e aplicar a numeração final de figuras pelo capítulo (ex.: Figura 5.1, Figura 5.2).',
].join('\n');
await writeFile(path.join(OUT, 'LEIA-ME-legendas.md'), readme);
await writeFile(path.join(OUT, 'capturas-manifesto.json'),
  JSON.stringify({
    branch: 'design/conecta-petrol-v1',
    source: 'feat/conecta-rf13-rf14-agreement-versions',
    generated_at: new Date().toISOString(),
    viewport: {width:1440,height:900,scale:2},
    fixture: 'synthetic data only',
    captures,
    pageErrors: errors
  }, null, 2));
if (errors.length) console.warn('BROWSER_ERRORS', JSON.stringify(errors));
console.log('FINALIZADO', captures.length, 'imagens', 'erros=', errors.length);
await browser.close();
