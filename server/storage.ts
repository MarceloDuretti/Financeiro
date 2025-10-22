import { type User, type InsertUser, type Company, type InsertCompany } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  listCompanies(): Promise<Company[]>;
  getCompanyById(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private companies: Map<string, Company>;

  constructor() {
    this.users = new Map();
    this.companies = new Map();
    this.seedCompanies();
  }

  private seedCompanies() {
    const mockCompanies: Company[] = [
      {
        id: "1",
        code: "001",
        tradeName: "Tech Solutions Brasil",
        legalName: "Tech Solutions Brasil LTDA",
        cnpj: "12.345.678/0001-90",
        phone: "(11) 98765-4321",
        status: "Ativa",
        ie: "123.456.789.012",
        im: "98765432",
        dataAbertura: "15/03/2020",
        cnaePrincipal: "6201-5/00 - Desenvolvimento de programas de computador sob encomenda",
        cnaeSecundario: "6202-3/00 - Desenvolvimento e licenciamento de programas de computador customizáveis",
        regimeTributario: "Simples Nacional",
        porte: "ME",
        logradouro: "Av. Paulista",
        numero: "1000",
        complemento: "Sala 501",
        bairro: "Bela Vista",
        cidade: "São Paulo",
        uf: "SP",
        cep: "01310-100",
        email: "contato@techsolutions.com.br",
        website: "www.techsolutions.com.br",
        responsavelNome: "Carlos Silva",
        responsavelCargo: "CEO",
        responsavelTelefone: "(11) 98765-4321",
        responsavelEmail: "carlos@techsolutions.com.br",
        responsavelFoto: null,
        isActive: true,
      },
      {
        id: "2",
        code: "002",
        tradeName: "Comercial São Jorge",
        legalName: "Comercial São Jorge Alimentos LTDA",
        cnpj: "98.765.432/0001-10",
        phone: "(21) 3456-7890",
        status: "Ativa",
        ie: "987.654.321.098",
        im: "12345678",
        dataAbertura: "10/01/2018",
        cnaePrincipal: "4711-3/02 - Comércio varejista de mercadorias em geral",
        cnaeSecundario: null,
        regimeTributario: "Simples Nacional",
        porte: "EPP",
        logradouro: "Rua das Flores",
        numero: "250",
        complemento: null,
        bairro: "Centro",
        cidade: "Rio de Janeiro",
        uf: "RJ",
        cep: "20040-020",
        email: "contato@comercialsaojorge.com.br",
        website: "www.comercialsaojorge.com.br",
        responsavelNome: "Maria Santos",
        responsavelCargo: "Diretora Comercial",
        responsavelTelefone: "(21) 99876-5432",
        responsavelEmail: "maria@comercialsaojorge.com.br",
        responsavelFoto: null,
        isActive: false,
      },
      {
        id: "3",
        code: "003",
        tradeName: "Consultoria Apex",
        legalName: "Apex Consultoria Empresarial LTDA",
        cnpj: "45.678.901/0001-23",
        phone: "(31) 2345-6789",
        status: "Ativa",
        ie: "456.789.012.345",
        im: null,
        dataAbertura: "22/08/2019",
        cnaePrincipal: "7020-4/00 - Atividades de consultoria em gestão empresarial",
        cnaeSecundario: "8599-6/04 - Treinamento em desenvolvimento profissional e gerencial",
        regimeTributario: "Lucro Presumido",
        porte: "ME",
        logradouro: "Av. Afonso Pena",
        numero: "3500",
        complemento: "Conjunto 1205",
        bairro: "Funcionários",
        cidade: "Belo Horizonte",
        uf: "MG",
        cep: "30130-009",
        email: "contato@apexconsultoria.com.br",
        website: "www.apexconsultoria.com.br",
        responsavelNome: "João Oliveira",
        responsavelCargo: "Sócio Diretor",
        responsavelTelefone: "(31) 98234-5678",
        responsavelEmail: "joao@apexconsultoria.com.br",
        responsavelFoto: null,
        isActive: false,
      },
    ];

    mockCompanies.forEach((company) => {
      this.companies.set(company.id, company);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async listCompanies(): Promise<Company[]> {
    return Array.from(this.companies.values());
  }

  async getCompanyById(id: string): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const id = randomUUID();
    const company: Company = {
      id,
      code: insertCompany.code,
      tradeName: insertCompany.tradeName,
      legalName: insertCompany.legalName,
      cnpj: insertCompany.cnpj,
      phone: insertCompany.phone,
      status: insertCompany.status ?? "Ativa",
      ie: insertCompany.ie ?? null,
      im: insertCompany.im ?? null,
      dataAbertura: insertCompany.dataAbertura ?? null,
      cnaePrincipal: insertCompany.cnaePrincipal ?? null,
      cnaeSecundario: insertCompany.cnaeSecundario ?? null,
      regimeTributario: insertCompany.regimeTributario ?? null,
      porte: insertCompany.porte ?? null,
      logradouro: insertCompany.logradouro ?? null,
      numero: insertCompany.numero ?? null,
      complemento: insertCompany.complemento ?? null,
      bairro: insertCompany.bairro ?? null,
      cidade: insertCompany.cidade ?? null,
      uf: insertCompany.uf ?? null,
      cep: insertCompany.cep ?? null,
      email: insertCompany.email ?? null,
      website: insertCompany.website ?? null,
      responsavelNome: insertCompany.responsavelNome ?? null,
      responsavelCargo: insertCompany.responsavelCargo ?? null,
      responsavelTelefone: insertCompany.responsavelTelefone ?? null,
      responsavelEmail: insertCompany.responsavelEmail ?? null,
      responsavelFoto: insertCompany.responsavelFoto ?? null,
      isActive: insertCompany.isActive ?? false,
    };
    this.companies.set(id, company);
    return company;
  }

  async updateCompany(id: string, updates: Partial<InsertCompany>): Promise<Company | undefined> {
    const existing = this.companies.get(id);
    if (!existing) return undefined;
    
    const updated: Company = { ...existing, ...updates };
    this.companies.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
