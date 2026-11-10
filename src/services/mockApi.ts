/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  WorkerProfile,
  EmployerProfile,
  Offer,
  Proposal,
  Contract,
  Payment,
  Message,
  Notification,
  Review,
  ProposalStatus,
  UserRole,
  ProfileRole
} from '../types';
import { agreements } from './agreements';

// Storage keys
const USERS_KEY = 'serviplus_users';
const WORKERS_KEY = 'serviplus_workers';
const EMPLOYERS_KEY = 'serviplus_employers';
const OFFERS_KEY = 'serviplus_offers';
const PROPOSALS_KEY = 'serviplus_proposals';
const CONTRACTS_KEY = 'serviplus_contracts';
const PAYMENTS_KEY = 'serviplus_payments';
const MESSAGES_KEY = 'serviplus_messages';
const NOTIFICATIONS_KEY = 'serviplus_notifications';
const REVIEWS_KEY = 'serviplus_reviews';

// --- INITIAL MOCK DATA IN PORTUGUESE (Seed) ---
const INITIAL_USERS: User[] = [
  { id: 1, username: 'charlie_dev', email: 'charlie@gmail.com', first_name: 'Carlos', last_name: 'Tembe', role: 'worker', is_verified: true, date_joined: '2026-01-10' },
  { id: 2, username: 'elena_ux', email: 'elena@gmail.com', first_name: 'Elena', last_name: 'Nhaca', role: 'worker', is_verified: true, date_joined: '2026-02-15' },
  { id: 3, username: 'nelson_sysob', email: 'nelson@outlook.co.mz', first_name: 'Nelson', last_name: 'Macuácua', role: 'worker', is_verified: false, date_joined: '2026-05-10' },
  { id: 4, username: 'maputo_digital', email: 'vagas@maputodigital.co.mz', first_name: 'Maputo', last_name: 'Digital', role: 'employer', is_verified: true, date_joined: '2026-01-05' },
  { id: 5, username: 'inove_mz', email: 'geral@inovemz.com', first_name: 'Inove', last_name: 'Sistemas', role: 'employer', is_verified: true, date_joined: '2026-03-20' },
  { id: 6, username: 'admin_serviplus', email: 'admin@serviplus.co.mz', first_name: 'Admin', last_name: 'ServiPlus', role: 'admin', is_verified: true, date_joined: '2025-12-01' }
];

const INITIAL_WORKERS: WorkerProfile[] = [
  {
    id: 1,
    userId: 1,
    firstName: 'Carlos',
    lastName: 'Tembe',
    email: 'charlie@gmail.com',
    title: 'Desenvolvedor Full-Stack React & Django',
    bio: 'Desenvolvedor com 4 anos de experiência na criação de soluções web escaláveis. Especializado em React, Node.js e Django Rest Framework. Residente na Polana, Maputo.',
    skills: ['React', 'Django', 'PostgreSQL', 'Tailwind', 'TypeScript', 'Git'],
    githubLink: 'https://github.com/carlostembe',
    portfolioLink: 'https://carlostembe.dev',
    experienceYears: 4,
    completedJobs: 18,
    averageRating: 4.9,
    documentStatus: 'approved',
    location: 'Polana, Maputo'
  },
  {
    id: 2,
    userId: 2,
    firstName: 'Elena',
    lastName: 'Nhaca',
    email: 'elena@gmail.com',
    title: 'Designer UI/UX & Mobile Specialist',
    bio: 'Focada em desenhar experiências intuitivas que geram resultados. Layouts limpos, mobile-friendly e com excelente usabilidade. Formada pela UEM.',
    skills: ['Figma', 'Adobe XD', 'Landing Pages', 'Responsive Design', 'Wireframing'],
    portfolioLink: 'https://behance.net/elenanhaca',
    experienceYears: 3,
    completedJobs: 12,
    averageRating: 4.7,
    documentStatus: 'approved',
    location: 'Sommerschield, Maputo'
  },
  {
    id: 3,
    userId: 3,
    firstName: 'Nelson',
    lastName: 'Macuácua',
    email: 'nelson@outlook.co.mz',
    title: 'Administrador de Sistemas & Cloud',
    bio: 'Especialista em segurança de redes, Linux, AWS, Docker e suporte local a servidores. Buscando projetos de infraestrutura de TI.',
    skills: ['Linux', 'Redes', 'Docker', 'AWS', 'Segurança de Informação'],
    githubLink: 'https://github.com/nelsonmacuacua',
    experienceYears: 2,
    completedJobs: 3,
    averageRating: 4.5,
    documentStatus: 'pending', // Pending document review
    location: 'Bairro Central, Maputo'
  }
];

const INITIAL_EMPLOYERS: EmployerProfile[] = [
  {
    id: 1,
    userId: 4,
    companyName: 'Maputo Digital',
    contactName: 'Mário Langa',
    email: 'vagas@maputodigital.co.mz',
    description: 'Agência líder em transformação digital de pequenas e médias empresas em Moçambique. Criamos websites, marketing digital e consultoria tecnológica.',
    location: 'Av. Julius Nyerere, Sommerschield',
    website: 'https://maputodigital.co.mz',
    industry: 'Tecnologia de Informação',
    documentStatus: 'approved'
  },
  {
    id: 2,
    userId: 5,
    companyName: 'Inove Sistemas',
    contactName: 'Sofia Manjate',
    email: 'geral@inovemz.com',
    description: 'Empresa especializada em soluções de faturação e ERP local para o mercado moçambicano.',
    location: 'Av. Eduardo Mondlane, Centro da Cidade',
    website: 'https://inovemz.com',
    industry: 'Software de Gestão',
    documentStatus: 'approved'
  }
];

const INITIAL_OFFERS: Offer[] = [
  {
    id: 1,
    employerId: 1,
    employerProfile: INITIAL_EMPLOYERS[0],
    title: 'Desenvolvimento de Portal E-commerce Local',
    description: 'Precisamos de um programador React experiente para criar um portal de comércio eletrónico integrado com M-Pesa e e-Mola. O design em Figma já está pronto. O backend em Django está sendo feito por nossa equipe interna. Requisitos: TypeScript, gestão de estado com React Context ou Redux, e integração fluida de APIs REST.',
    category: 'Desenvolvimento Web',
    requiredSkills: ['React', 'TypeScript', 'Tailwind', 'M-Pesa API'],
    salaryBudget: 75000, // MT
    location: 'Híbrido (Maputo / Remoto)',
    status: 'active',
    createdAt: '2026-05-20T10:00:00Z'
  },
  {
    id: 2,
    employerId: 1,
    employerProfile: INITIAL_EMPLOYERS[0],
    title: 'UI/UX Redesign para Web App Financeiro',
    description: 'Buscamos um designer UI/UX freelancer em Maputo para reestruturar a UI do nosso dashboard de investimentos. O trabalho inclui entrevistas rápidas com usuários, mapeamento de fluxo, prototipagem em Figma com design system bem estruturado.',
    category: 'Design UI/UX',
    requiredSkills: ['Figma', 'Responsive Design', 'Wireframing'],
    salaryBudget: 45000,
    location: 'Remoto',
    status: 'active',
    createdAt: '2026-05-24T14:30:00Z'
  },
  {
    id: 3,
    employerId: 2,
    employerProfile: INITIAL_EMPLOYERS[1],
    title: 'Configuração e Securização de Servidor Linux local',
    description: 'Procuramos técnico especialista em Linux/Ubuntu Server para auditar nosso servidor central local, configurar backups automatizados na Cloud, otimizar base de dados PostgreSQL e configurar regras rígidas de Firewall.',
    category: 'Redes e Telecomunicações',
    requiredSkills: ['Linux', 'Segurança de Informação', 'PostgreSQL', 'Docker'],
    salaryBudget: 35000,
    location: 'Presencial (Bairro Central, Maputo)',
    status: 'active',
    createdAt: '2026-05-26T08:15:00Z'
  }
];

const INITIAL_PROPOSALS: Proposal[] = [
  {
    id: 1,
    offerId: 1,
    offerTitle: 'Desenvolvimento de Portal E-commerce Local',
    employerId: 4,
    workerId: 1,
    workerProfile: INITIAL_WORKERS[0],
    description: 'Olá Mário! Tenho ampla experiência em integrações de carteiras móveis como M-Pesa API (utilizando o IPG oficial). Posso construir a interface em React usando Tailwind com alta performance e tipagem rigorosa de TypeScript. Consigo entregar o protótipo funcional em duas semanas e a versão final integrada em 20 dias.',
    priceProposal: 70000,
    timelineDays: 20,
    status: 'pending',
    createdAt: '2026-05-21T11:00:00Z'
  },
  {
    id: 2,
    offerId: 2,
    offerTitle: 'UI/UX Redesign para Web App Financeiro',
    employerId: 4,
    workerId: 2,
    workerProfile: INITIAL_WORKERS[1],
    description: 'Olá! Adoraria trabalhar neste redesign. Já trabalhei com interfaces de fintechs e compreendo como organizar gráficos e dados complexos para facilitar a digestão de informação financeira pelo usuário final. Posso enviar portfólio adicional pelo chat.',
    priceProposal: 40000,
    timelineDays: 14,
    status: 'pending',
    createdAt: '2026-05-25T16:00:00Z'
  }
];

const INITIAL_CONTRACTS: Contract[] = [];
const INITIAL_PAYMENTS: Payment[] = [];
const INITIAL_MESSAGES: Message[] = [
  { id: 1, senderId: 4, receiverId: 1, text: 'Olá Carlos, vimos a tua proposta para o portal E-commerce. Tens experiência prévia com chaves RSA para assinatura do M-Pesa?', createdAt: '2026-05-22T09:00:00Z' },
  { id: 2, senderId: 1, receiverId: 4, text: 'Olá Mário! Sim, já configurei tanto a sandbox oficial como o ambiente de produção. Tenho inclusive um middleware utilitário estruturado para decifrar a resposta segura do gateway.', createdAt: '2026-05-22T10:15:00Z' }
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 1, userId: 1, text: 'O empregador Maputo Digital enviou uma mensagem sobre o projeto Portal E-commerce.', isRead: false, createdAt: '2026-05-22T09:01:00Z', type: 'message' },
  { id: 2, userId: 4, text: 'Nova proposta recebida de Carlos Tembe para "Desenvolvimento de Portal E-commerce Local".', isRead: true, createdAt: '2026-05-21T11:01:00Z', type: 'proposal' },
  { id: 3, userId: 3, text: 'Os seus documentos de identidade foram recebidos e estão aguardando revisão editorial da equipe do ServiPlus.', isRead: false, createdAt: '2026-05-10T12:00:00Z', type: 'verification' }
];

const INITIAL_REVIEWS: Review[] = [
  { id: 1, contractId: 101, authorId: 4, authorName: 'Maputo Digital', targetId: 1, score: 5, comment: 'Excelente desenvolvedor, super ético, pontual e muito forte tecnicamente. Recomendo imenso o Carlos para qualquer projeto complexo.', createdAt: '2026-04-12T17:00:00Z' },
  { id: 2, contractId: 102, authorId: 5, authorName: 'Inove Sistemas', targetId: 2, score: 4.8, comment: 'Visual do app super aprimorado, as animações solicitadas foram excelentes. Voltaríamos a trabalhar juntos sem hesitação.', createdAt: '2026-05-02T11:30:00Z' }
];

// Helper to check and seed localStorage
const seedLocalStorage = () => {
  if (!localStorage.getItem(USERS_KEY)) localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
  if (!localStorage.getItem(WORKERS_KEY)) localStorage.setItem(WORKERS_KEY, JSON.stringify(INITIAL_WORKERS));
  if (!localStorage.getItem(EMPLOYERS_KEY)) localStorage.setItem(EMPLOYERS_KEY, JSON.stringify(INITIAL_EMPLOYERS));
  if (!localStorage.getItem(OFFERS_KEY)) localStorage.setItem(OFFERS_KEY, JSON.stringify(INITIAL_OFFERS));
  if (!localStorage.getItem(PROPOSALS_KEY)) localStorage.setItem(PROPOSALS_KEY, JSON.stringify(INITIAL_PROPOSALS));
  if (!localStorage.getItem(CONTRACTS_KEY)) localStorage.setItem(CONTRACTS_KEY, JSON.stringify(INITIAL_CONTRACTS));
  if (!localStorage.getItem(PAYMENTS_KEY)) localStorage.setItem(PAYMENTS_KEY, JSON.stringify(INITIAL_PAYMENTS));
  if (!localStorage.getItem(MESSAGES_KEY)) localStorage.setItem(MESSAGES_KEY, JSON.stringify(INITIAL_MESSAGES));
  if (!localStorage.getItem(NOTIFICATIONS_KEY)) localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
  if (!localStorage.getItem(REVIEWS_KEY)) localStorage.setItem(REVIEWS_KEY, JSON.stringify(INITIAL_REVIEWS));
};

seedLocalStorage();

// Standard utilities to get/set lists
const getList = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setList = <T>(key: string, list: T[]): void => {
  localStorage.setItem(key, JSON.stringify(list));
};

// Simulation delay for Django API feel (150ms)
const delay = (ms = 150) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  // ---- AUTHENTICATION ----
  auth: {
    async login(emailOrUsername: string, preferredRole?: ProfileRole): Promise<{ user: User; profile?: WorkerProfile | EmployerProfile } | null> {
      await delay();
      const users = getList<User>(USERS_KEY);
      const account = users.find(u => u.email === emailOrUsername || u.username === emailOrUsername);
      if (!account) return null;

      if (account.role === 'admin') return { user: { ...account, roles: [] } };

      // Papéis efectivos derivam dos perfis criados, não de uma opção de sessão manipulável.
      const roles: ProfileRole[] = [];
      const worker = getList<WorkerProfile>(WORKERS_KEY).find(w => w.userId === account.id);
      const employer = getList<EmployerProfile>(EMPLOYERS_KEY).find(e => e.userId === account.id);
      if (worker) roles.push('worker');
      if (employer) roles.push('employer');

      const role = preferredRole && roles.includes(preferredRole)
        ? preferredRole
        : roles.includes(account.role as ProfileRole) ? account.role as ProfileRole : roles[0];
      if (!role) return null;
      const profile = role === 'worker' ? worker : employer;
      return {
        user: { ...account, role, roles, is_verified: profile?.documentStatus === 'approved' },
        profile
      };
    },

    async register(payload: {
      username: string;
      email: string;
      firstName: string;
      lastName: string;
      role: 'employer' | 'worker';
      companyName?: string;
      title?: string;
      bio?: string;
      industry?: string;
      skills?: string[];
      location: string;
    }): Promise<{ user: User; profile: WorkerProfile | EmployerProfile }> {
      await delay();
      const users = getList<User>(USERS_KEY);
      if (users.some(u => u.email.toLowerCase() === payload.email.trim().toLowerCase() ||
        u.username.toLowerCase() === payload.username.trim().toLowerCase())) {
        throw new Error('Email ou nome de utilizador já registado.');
      }
      const isVerifiedDefault = false; // Registration keeps users unverified until documents are approved

      const newUser: User = {
        id: users.length + 1,
        username: payload.username.toLowerCase(),
        email: payload.email,
        first_name: payload.firstName,
        last_name: payload.lastName,
        role: payload.role,
        roles: [payload.role],
        is_verified: isVerifiedDefault,
        date_joined: new Date().toISOString().split('T')[0]
      };

      users.push(newUser);
      setList(USERS_KEY, users);

      let profile: WorkerProfile | EmployerProfile;

      if (payload.role === 'worker') {
        const workers = getList<WorkerProfile>(WORKERS_KEY);
        const newWorker: WorkerProfile = {
          id: workers.length + 1,
          userId: newUser.id,
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          title: payload.title || 'Freelancer de TI',
          bio: payload.bio || '',
          skills: payload.skills || [],
          experienceYears: 0,
          completedJobs: 0,
          averageRating: 5.0,
          documentStatus: 'unsubmitted',
          location: payload.location,
        };
        workers.push(newWorker);
        setList(WORKERS_KEY, workers);
        profile = newWorker;
      } else {
        const employers = getList<EmployerProfile>(EMPLOYERS_KEY);
        const newEmployer: EmployerProfile = {
          id: employers.length + 1,
          userId: newUser.id,
          companyName: payload.companyName || `${payload.firstName} ${payload.lastName}`,
          contactName: `${payload.firstName} ${payload.lastName}`,
          email: payload.email,
          description: payload.bio || '',
          location: payload.location,
          industry: payload.industry || 'Geral',
          documentStatus: 'unsubmitted'
        };
        employers.push(newEmployer);
        setList(EMPLOYERS_KEY, employers);
        profile = newEmployer;
      }

      // Generate welcome notification
      const notifications = getList<Notification>(NOTIFICATIONS_KEY);
      notifications.unshift({
        id: notifications.length + 1,
        userId: newUser.id,
        text: `Bem-vindo ao ServiPlus, ${newUser.first_name}! Por favor, faça o upload dos seus documentos de identificação ou registo oficial para verificar a sua conta e aceder a todas as funcionalidades.`,
        isRead: false,
        createdAt: new Date().toISOString(),
        type: 'verification'
      });
      setList(NOTIFICATIONS_KEY, notifications);

      return { user: newUser, profile };
    },

    async uploadVerificationDocument(userId: number, role: ProfileRole, documentUrl: string): Promise<boolean> {
      await delay();
      const users = getList<User>(USERS_KEY);
      if (!users.some(u => u.id === userId && u.role !== 'admin')) return false;
      let updated = false;
      if (role === 'worker') {
        const workers = getList<WorkerProfile>(WORKERS_KEY);
        const idx = workers.findIndex(w => w.userId === userId);
        if (idx >= 0) {
          workers[idx].documentStatus = 'pending';
          workers[idx].documentUrl = documentUrl;
          setList(WORKERS_KEY, workers);
          updated = true;
        }
      } else {
        const employers = getList<EmployerProfile>(EMPLOYERS_KEY);
        const idx = employers.findIndex(e => e.userId === userId);
        if (idx >= 0) {
          employers[idx].documentStatus = 'pending';
          employers[idx].documentUrl = documentUrl;
          setList(EMPLOYERS_KEY, employers);
          updated = true;
        }
      }
      if (!updated) return false;
      const notifications = getList<Notification>(NOTIFICATIONS_KEY);
      notifications.unshift({
        id: notifications.length + 1, userId,
        text: 'Documentação do perfil enviada para análise.',
        isRead: false, createdAt: new Date().toISOString(), type: 'verification'
      });
      setList(NOTIFICATIONS_KEY, notifications);
      return true;
    },

    // V01 / RN01: criar o segundo perfil na conta existente, sem criar outra conta.
    async createAdditionalProfile(userId: number, role: ProfileRole, payload: {
      location?: string;
      bio?: string;
      title?: string;
      skills?: string[];
      companyName?: string;
      industry?: string;
    }): Promise<WorkerProfile | EmployerProfile> {
      await delay();
      const users = getList<User>(USERS_KEY);
      const user = users.find(u => u.id === userId);
      if (!user || user.role === 'admin') throw new Error('Conta não elegível.');
      const roles: ProfileRole[] = [];
      if (getList<WorkerProfile>(WORKERS_KEY).some(w => w.userId === userId)) roles.push('worker');
      if (getList<EmployerProfile>(EMPLOYERS_KEY).some(e => e.userId === userId)) roles.push('employer');
      if (roles.includes(role)) throw new Error('Este perfil já existe nesta conta.');

      let profile: WorkerProfile | EmployerProfile;
      if (role === 'worker') {
        if (!payload.title?.trim()) throw new Error('Indique a especialidade profissional.');
        const workers = getList<WorkerProfile>(WORKERS_KEY);
        profile = {
          id: Math.max(0, ...workers.map(w => w.id)) + 1,
          userId, firstName: user.first_name, lastName: user.last_name, email: user.email,
          title: payload.title.trim(), bio: payload.bio?.trim() || '',
          skills: payload.skills || [], experienceYears: 0, completedJobs: 0,
          averageRating: 0, documentStatus: 'unsubmitted', location: payload.location?.trim() || ''
        };
        setList(WORKERS_KEY, [...workers, profile]);
      } else {
        const employers = getList<EmployerProfile>(EMPLOYERS_KEY);
        profile = {
          id: Math.max(0, ...employers.map(e => e.id)) + 1,
          userId, companyName: payload.companyName?.trim() || [user.first_name, user.last_name].join(' '),
          contactName: [user.first_name, user.last_name].join(' '),
          email: user.email, description: payload.bio?.trim() || '',
          location: payload.location?.trim() || '', industry: payload.industry?.trim() || '',
          documentStatus: 'unsubmitted'
        };
        setList(EMPLOYERS_KEY, [...employers, profile]);
      }
      user.roles = [...roles, role];
      setList(USERS_KEY, users);
      return profile;
    },

    async updateProfile(userId: number, role: 'worker' | 'employer', payload: any): Promise<any> {
      await delay();
      if (role === 'worker') {
        const workers = getList<WorkerProfile>(WORKERS_KEY);
        const idx = workers.findIndex(w => w.userId === userId);
        if (idx > -1) {
          workers[idx] = { ...workers[idx], ...payload };
          setList(WORKERS_KEY, workers);
          return workers[idx];
        }
      } else {
        const employers = getList<EmployerProfile>(EMPLOYERS_KEY);
        const idx = employers.findIndex(e => e.userId === userId);
        if (idx > -1) {
          employers[idx] = { ...employers[idx], ...payload };
          setList(EMPLOYERS_KEY, employers);
          return employers[idx];
        }
      }
      return null;
    }
  },

  // ---- OFFERS (JOB POSTS) ----
  offers: {
    async list(): Promise<Offer[]> {
      await delay();
      return getList<Offer>(OFFERS_KEY);
    },

    async get(id: number): Promise<Offer | null> {
      await delay();
      const offers = getList<Offer>(OFFERS_KEY);
      return offers.find(o => o.id === id) || null;
    },

    async create(employerUserId: number, payload: {
      title: string;
      description: string;
      category: string;
      requiredSkills: string[];
      salaryBudget: number;
      location: string;
    }): Promise<Offer> {
      await delay();
      
      const employers = getList<EmployerProfile>(EMPLOYERS_KEY);
      const employerProfile = employers.find(e => e.userId === employerUserId);
      if (!employerProfile) {
        throw new Error('Perfil de empregador não encontrado');
      }

      if (employerProfile.documentStatus !== 'approved') {
        throw new Error('Apenas empresas com perfil verificado podem publicar vagas.');
      }

      const offers = getList<Offer>(OFFERS_KEY);
      const newOffer: Offer = {
        id: offers.length + 1,
        employerId: employerProfile.id,
        employerProfile: employerProfile,
        title: payload.title,
        description: payload.description,
        category: payload.category,
        requiredSkills: payload.requiredSkills,
        salaryBudget: Number(payload.salaryBudget),
        location: payload.location,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      offers.unshift(newOffer);
      setList(OFFERS_KEY, offers);

      return newOffer;
    },

    async complete(offerId: number): Promise<boolean> {
      await delay();
      const offers = getList<Offer>(OFFERS_KEY);
      const idx = offers.findIndex(o => o.id === offerId);
      if (idx > -1) {
        offers[idx].status = 'completed';
        setList(OFFERS_KEY, offers);
        return true;
      }
      return false;
    }
  },

  // ---- PROPOSALS ----
  proposals: {
    async list(): Promise<Proposal[]> {
      await delay();
      return getList<Proposal>(PROPOSALS_KEY);
    },

    async getForOffer(offerId: number): Promise<Proposal[]> {
      await delay();
      const proposals = getList<Proposal>(PROPOSALS_KEY);
      return proposals.filter(p => p.offerId === offerId);
    },

    async getForWorker(workerId: number): Promise<Proposal[]> {
      await delay();
      const proposals = getList<Proposal>(PROPOSALS_KEY);
      return proposals.filter(p => p.workerId === workerId);
    },

    async create(workerUserId: number, offerId: number, payload: {
      description: string;
      priceProposal: number;
      timelineDays: number;
    }): Promise<Proposal> {
      await delay();
      
      const workers = getList<WorkerProfile>(WORKERS_KEY);
      const workerProfile = workers.find(w => w.userId === workerUserId);
      if (!workerProfile) {
        throw new Error('Perfil de freelancer não encontrado');
      }

      if (workerProfile.documentStatus !== 'approved') {
        throw new Error('Apenas profissionais com perfil verificado podem submeter propostas.');
      }

      const offers = getList<Offer>(OFFERS_KEY);
      const offer = offers.find(o => o.id === offerId);
      if (!offer) throw new Error('Oportunidade não encontrada.');
      if (offer.status !== 'active') throw new Error('Oportunidade indisponível para propostas.');
      if (offer.employerProfile.userId === workerUserId) {
        throw new Error('RN02: não pode propor à sua própria oportunidade.');
      }

      const proposals = getList<Proposal>(PROPOSALS_KEY);
      if (proposals.some(p => p.offerId === offerId && p.workerProfile.userId === workerUserId && p.status !== 'cancelled')) {
        throw new Error('Já submeteu uma proposta a esta oportunidade.');
      }
      const newProposal: Proposal = {
        id: proposals.length + 1,
        offerId: offer.id,
        offerTitle: offer.title,
        employerId: offer.employerProfile.userId,
        workerId: workerProfile.id,
        workerProfile: workerProfile,
        description: payload.description,
        priceProposal: Number(payload.priceProposal),
        timelineDays: Number(payload.timelineDays),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      proposals.unshift(newProposal);
      setList(PROPOSALS_KEY, proposals);

      // Notify Employer
      const notifications = getList<Notification>(NOTIFICATIONS_KEY);
      notifications.unshift({
        id: notifications.length + 1,
        userId: offer.employerProfile.userId,
        text: `Recebeu uma nova proposta de ${workerProfile.firstName} para "${offer.title}".`,
        isRead: false,
        createdAt: new Date().toISOString(),
        type: 'proposal'
      });
      setList(NOTIFICATIONS_KEY, notifications);

      return newProposal;
    },

    async updateStatus(id: number, status: ProposalStatus): Promise<boolean> {
      await delay();
      const proposals = getList<Proposal>(PROPOSALS_KEY);
      const idx = proposals.findIndex(p => p.id === id);
      if (idx > -1) {
        proposals[idx].status = status;
        setList(PROPOSALS_KEY, proposals);

        // Notify worker
        const notifications = getList<Notification>(NOTIFICATIONS_KEY);
        const statusMap: Record<string, string> = {
          accepted: 'ACEITE',
          rejected: 'RECUSADA',
          cancelled: 'CANCELADA'
        };
        const portStatus = statusMap[status] || status;

        notifications.unshift({
          id: notifications.length + 1,
          userId: proposals[idx].workerProfile.userId,
          text: `A sua proposta para o projeto "${proposals[idx].offerTitle}" foi ${portStatus}.`,
          isRead: false,
          createdAt: new Date().toISOString(),
          type: 'proposal'
        });
        setList(NOTIFICATIONS_KEY, notifications);

        return true;
      }
      return false;
    }
  },

  // ---- CONTRACTS ----
  contracts: {
    async list(): Promise<Contract[]> {
      await delay();
      return getList<Contract>(CONTRACTS_KEY);
    },

    async getForUser(userId: number, role: UserRole): Promise<Contract[]> {
      await delay();
      const contracts = getList<Contract>(CONTRACTS_KEY);
      if (role === 'employer') {
        return contracts.filter(c => c.employerId === userId);
      } else if (role === 'worker') {
        const workers = getList<WorkerProfile>(WORKERS_KEY);
        const me = workers.find(w => w.userId === userId);
        if (!me) return [];
        return contracts.filter(c => c.workerId === me.id);
      }
      return contracts;
    },

    async createFromProposal(employerUserId: number, proposalId: number): Promise<Contract> {
      await delay();
      const proposals = getList<Proposal>(PROPOSALS_KEY);
      const proposal = proposals.find(p => p.id === proposalId);
      if (!proposal) throw new Error('Proposta não encontrada');

      const offers = getList<Offer>(OFFERS_KEY);
      const offer = offers.find(o => o.id === proposal.offerId);
      if (!offer) throw new Error('Vaga de emprego associada não encontrada');
      if (offer.employerProfile.userId !== employerUserId) {
        throw new Error('Apenas o empregador desta oportunidade pode aceitar a proposta.');
      }
      if (proposal.workerProfile.userId === employerUserId) {
        throw new Error('RN02: autocontratação não permitida.');
      }
      if (proposal.status !== 'pending') throw new Error('Esta proposta já foi processada.');

      const employers = getList<EmployerProfile>(EMPLOYERS_KEY);
      const employerProfile = employers.find(e => e.userId === employerUserId);
      if (!employerProfile) throw new Error('Perfil de empregador não encontrado');

      const contracts = getList<Contract>(CONTRACTS_KEY);
      const newContract: Contract = {
        id: contracts.length + 1,
        proposalId: proposal.id,
        offerId: offer.id,
        employerId: employerUserId,
        workerId: proposal.workerId,
        employerProfile: employerProfile,
        workerProfile: proposal.workerProfile,
        title: offer.title,
        description: `Contrato referente ao projecto: ${offer.title}.\n\nProposta aceite de ${proposal.workerProfile.firstName} ${proposal.workerProfile.lastName}.\nDetalhes do escopo: ${proposal.description}`,
        budget: proposal.priceProposal,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + proposal.timelineDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
        createdAt: new Date().toISOString(),
        signedByWorker: false,
        signedByEmployer: false // A aceitação da proposta não substitui a aprovação explícita do acordo
      };

      contracts.unshift(newContract);
      setList(CONTRACTS_KEY, contracts);
      await agreements.initializeDraft(newContract.id, employerUserId);

      // Update proposal status to accepted
      proposal.status = 'accepted';
      setList(PROPOSALS_KEY, proposals);

      // Notify Worker
      const notifications = getList<Notification>(NOTIFICATIONS_KEY);
      notifications.unshift({
        id: notifications.length + 1,
        userId: proposal.workerProfile.userId,
        text: `Contrato criado para "${offer.title}". Por favor, aceda aos seus contratos para ler e assinar.`,
        isRead: false,
        createdAt: new Date().toISOString(),
        type: 'contract'
      });
      setList(NOTIFICATIONS_KEY, notifications);

      return newContract;
    },

    // Compatibilidade com o fluxo antigo: apenas aprovação expressa de uma versão publicada.
    // A assinatura eletrónica demonstrativa só activa o contrato com a aceitação de AMBAS as partes.
    async sign(contractId: number, workerUserId: number): Promise<boolean> {
      try {
        const contract = getList<Contract>(CONTRACTS_KEY).find(c => c.id === contractId);
        if (!contract || contract.workerProfile.userId !== workerUserId) return false;
        const available = await agreements.listForContract(contractId, workerUserId);
        const pending = available.find(v => v.status === 'PENDING_APPROVAL');
        if (!pending) return false;
        await agreements.approve(pending.id, workerUserId);
        return true;
      } catch {
        return false;
      }
    },

    async complete(contractId: number): Promise<boolean> {
      await delay();
      const contracts = getList<Contract>(CONTRACTS_KEY);
      const idx = contracts.findIndex(c => c.id === contractId);
      if (idx > -1) {
        contracts[idx].status = 'completed';
        setList(CONTRACTS_KEY, contracts);

        // Sync with offer
        const offers = getList<Offer>(OFFERS_KEY);
        const oIdx = offers.findIndex(o => o.id === contracts[idx].offerId);
        if (oIdx > -1) {
          offers[oIdx].status = 'completed';
          setList(OFFERS_KEY, offers);
        }

        // Add 1 to completed jobs for worker
        const workers = getList<WorkerProfile>(WORKERS_KEY);
        const wIdx = workers.findIndex(w => w.id === contracts[idx].workerId);
        if (wIdx > -1) {
          workers[wIdx].completedJobs += 1;
          setList(WORKERS_KEY, workers);
        }

        // Notify worker
        const notifications = getList<Notification>(NOTIFICATIONS_KEY);
        notifications.unshift({
          id: notifications.length + 1,
          userId: contracts[idx].workerProfile.userId,
          text: `O contrato para "${contracts[idx].title}" foi marcado como CONCLUÍDO. A conclusão do serviço não comprova nem efectua pagamentos.`,
          isRead: false,
          createdAt: new Date().toISOString(),
          type: 'contract'
        });
        setList(NOTIFICATIONS_KEY, notifications);

        return true;
      }
      return false;
    },


  },

  // Pagamentos externos são apenas declarações, ver externalPayments.ts (RN09/RN10).

  // ---- CHAT / MESSAGES ----
  messages: {
    async listThread(userId: number, peerId: number): Promise<Message[]> {
      await delay();
      const messages = getList<Message>(MESSAGES_KEY);
      return messages.filter(
        m => (m.senderId === userId && m.receiverId === peerId) ||
             (m.senderId === peerId && m.receiverId === userId)
      ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },

    async listChatContacts(userId: number): Promise<any[]> {
      await delay();
      const messages = getList<Message>(MESSAGES_KEY);
      const users = getList<User>(USERS_KEY);
      const workers = getList<WorkerProfile>(WORKERS_KEY);
      const employers = getList<EmployerProfile>(EMPLOYERS_KEY);

      // Find all distinct peer IDs
      const peerIds = new Set<number>();
      messages.forEach(m => {
        if (m.senderId === userId) peerIds.add(m.receiverId);
        if (m.receiverId === userId) peerIds.add(m.senderId);
      });

      const contacts: any[] = [];
      peerIds.forEach(peerId => {
        const peerObj = users.find(u => u.id === peerId);
        if (!peerObj) return;

        let name = `${peerObj.first_name} ${peerObj.last_name}`;
        let sub = '';

        if (peerObj.role === 'worker') {
          const w = workers.find(wp => wp.userId === peerId);
          name = w ? `${w.firstName} ${w.lastName}` : name;
          sub = w ? w.title : 'Profissional de TI';
        } else if (peerObj.role === 'employer') {
          const e = employers.find(ep => ep.userId === peerId);
          name = e ? e.companyName : name;
          sub = e ? e.industry : 'Contratante';
        }

        // Get last message in thread
        const thread = messages.filter(
          m => (m.senderId === userId && m.receiverId === peerId) ||
               (m.senderId === peerId && m.receiverId === userId)
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        contacts.push({
          id: peerId,
          name,
          subtitle: sub,
          role: peerObj.role,
          lastMsg: thread[0] ? thread[0].text : '',
          lastTime: thread[0] ? thread[0].createdAt : peerObj.date_joined
        });
      });

      return contacts;
    },

    async send(senderId: number, receiverId: number, text: string): Promise<Message> {
      await delay();
      const messages = getList<Message>(MESSAGES_KEY);
      const newMsg: Message = {
        id: messages.length + 1,
        senderId,
        receiverId,
        text,
        createdAt: new Date().toISOString()
      };
      messages.push(newMsg);
      setList(MESSAGES_KEY, messages);

      // Create message notification for recipient
      const notifications = getList<Notification>(NOTIFICATIONS_KEY);
      notifications.unshift({
        id: notifications.length + 1,
        userId: receiverId,
        text: `Nova mensagem recebida: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`,
        isRead: false,
        createdAt: new Date().toISOString(),
        type: 'message'
      });
      setList(NOTIFICATIONS_KEY, notifications);

      return newMsg;
    }
  },

  // ---- NOTIFICATIONS ----
  notifications: {
    async list(userId: number): Promise<Notification[]> {
      await delay();
      const notifications = getList<Notification>(NOTIFICATIONS_KEY);
      return notifications.filter(n => n.userId === userId);
    },

    async markRead(id: number): Promise<boolean> {
      await delay();
      const notifications = getList<Notification>(NOTIFICATIONS_KEY);
      const idx = notifications.findIndex(n => n.id === id);
      if (idx > -1) {
        notifications[idx].isRead = true;
        setList(NOTIFICATIONS_KEY, notifications);
        return true;
      }
      return false;
    },

    async markAllRead(userId: number): Promise<boolean> {
      await delay();
      const notifications = getList<Notification>(NOTIFICATIONS_KEY);
      notifications.forEach(n => {
        if (n.userId === userId) {
          n.isRead = true;
        }
      });
      setList(NOTIFICATIONS_KEY, notifications);
      return true;
    }
  },

  // ---- REVIEWS & RATINGS ----
  reviews: {
    async listForTarget(targetUserId: number): Promise<Review[]> {
      await delay();
      const reviews = getList<Review>(REVIEWS_KEY);
      return reviews.filter(r => r.targetId === targetUserId);
    },

    async create(contractId: number, authorUserId: number, authorRole: ProfileRole, rating: number, comment: string): Promise<Review | null> {
      await delay();
      const contracts = getList<Contract>(CONTRACTS_KEY);
      const contract = contracts.find(c => c.id === contractId);
      if (!contract) return null;

      const users = getList<User>(USERS_KEY);
      const author = users.find(u => u.id === authorUserId);
      if (!author || contract.status !== 'completed' || rating < 1 || rating > 5) return null;
      const isEmployer = authorRole === 'employer' && contract.employerId === authorUserId;
      const isWorker = authorRole === 'worker' && contract.workerProfile.userId === authorUserId;
      if (!isEmployer && !isWorker) return null;
      const targetId = isEmployer ? contract.workerProfile.userId : contract.employerId;

      const reviews = getList<Review>(REVIEWS_KEY);
      if (reviews.some(r => r.contractId === contractId && r.authorId === authorUserId)) return null;
      const newReview: Review = {
        id: reviews.length + 1,
        contractId,
        authorId: authorUserId,
        authorName: isEmployer ? contract.employerProfile.companyName : `${author.first_name} ${author.last_name}`,
        targetId,
        score: rating,
        comment,
        createdAt: new Date().toISOString()
      };

      reviews.unshift(newReview);
      setList(REVIEWS_KEY, reviews);

      // Recalculate average rating of target if worker
      const targetUser = users.find(u => u.id === targetId);
      if (isEmployer) {
        const workers = getList<WorkerProfile>(WORKERS_KEY);
        const wIdx = workers.findIndex(w => w.userId === targetId);
        if (wIdx > -1) {
          const targetReviews = reviews.filter(r => r.targetId === targetId);
          const totalScore = targetReviews.reduce((sum, r) => sum + r.score, 0);
          workers[wIdx].averageRating = Number((totalScore / targetReviews.length).toFixed(1));
          setList(WORKERS_KEY, workers);
        }
      }

      // Notify the target user
      const notifications = getList<Notification>(NOTIFICATIONS_KEY);
      notifications.unshift({
        id: notifications.length + 1,
        userId: targetId,
        text: `Recebeu uma nova classificação de ${rating} estrelas para o projeto "${contract.title}".`,
        isRead: false,
        createdAt: new Date().toISOString(),
        type: 'system'
      });
      setList(NOTIFICATIONS_KEY, notifications);

      return newReview;
    }
  },

  // ---- SPECIALIZED ADMIN ENDPOINTS ----
  admin: {
    async listAllUsers(): Promise<User[]> {
      await delay();
      return getList<User>(USERS_KEY);
    },

    async listPendingVerifications(): Promise<any[]> {
      await delay();
      const workers = getList<WorkerProfile>(WORKERS_KEY);
      const employers = getList<EmployerProfile>(EMPLOYERS_KEY);

      const items: any[] = [];
      workers.forEach(w => {
        if (w.documentStatus === 'pending') {
          items.push({
            id: w.id,
            userId: w.userId,
            name: `${w.firstName} ${w.lastName}`,
            role: 'worker',
            detail: w.title,
            docUrl: w.documentUrl || 'https://via.placeholder.com/150',
            location: w.location
          });
        }
      });

      employers.forEach(e => {
        if (e.documentStatus === 'pending') {
          items.push({
            id: e.id,
            userId: e.userId,
            name: e.companyName,
            role: 'employer',
            detail: e.industry,
            docUrl: e.documentUrl || 'https://via.placeholder.com/150',
            location: e.location
          });
        }
      });

      return items;
    },

    async approveDocument(userId: number, role: ProfileRole, approve: boolean): Promise<boolean> {
      await delay();
      const targetStatus = approve ? 'approved' : 'rejected';
      let updated = false;
      if (role === 'worker') {
        const workers = getList<WorkerProfile>(WORKERS_KEY);
        const idx = workers.findIndex(w => w.userId === userId && w.documentStatus === 'pending');
        if (idx >= 0) {
          workers[idx].documentStatus = targetStatus;
          setList(WORKERS_KEY, workers);
          updated = true;
        }
      } else {
        const employers = getList<EmployerProfile>(EMPLOYERS_KEY);
        const idx = employers.findIndex(e => e.userId === userId && e.documentStatus === 'pending');
        if (idx >= 0) {
          employers[idx].documentStatus = targetStatus;
          setList(EMPLOYERS_KEY, employers);
          updated = true;
        }
      }
      if (!updated) return false;
      const notifications = getList<Notification>(NOTIFICATIONS_KEY);
      notifications.unshift({
        id: notifications.length + 1, userId,
        text: approve ? 'O seu perfil foi aprovado.' : 'A documentação do seu perfil foi recusada.',
        isRead: false, createdAt: new Date().toISOString(), type: 'verification'
      });
      setList(NOTIFICATIONS_KEY, notifications);
      return true;
    },


  },

  // ---- ADDITIONAL READ ENDPOINTS FOR THE SEARCH PAGES ----
  workers: {
    async list(): Promise<WorkerProfile[]> {
      await delay();
      return getList<WorkerProfile>(WORKERS_KEY);
    },
    async get(id: number): Promise<WorkerProfile | null> {
      await delay();
      const workers = getList<WorkerProfile>(WORKERS_KEY);
      return workers.find(w => w.id === id) || null;
    }
  },

  employers: {
    async list(): Promise<EmployerProfile[]> {
      await delay();
      return getList<EmployerProfile>(EMPLOYERS_KEY);
    },
    async get(id: number): Promise<EmployerProfile | null> {
      await delay();
      const employers = getList<EmployerProfile>(EMPLOYERS_KEY);
      return employers.find(e => e.id === id) || null;
    }
  }
};
