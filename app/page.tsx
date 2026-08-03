"use client";

import { useState } from "react";

type Screen = "visao" | "cadastros" | "checkin" | "config";

const people = [
  { initials: "MA", name: "Mariana Alves", cpf: "•••.482.•••-10", bond: "Moradora", status: "Aprovado", color: "coral" },
  { initials: "JS", name: "João da Silva", cpf: "•••.731.•••-42", bond: "Eleitor", status: "Aprovado", color: "blue" },
  { initials: "AC", name: "Ana Costa", cpf: "•••.905.•••-18", bond: "IPVA em Flórida", status: "Em análise", color: "yellow" },
  { initials: "RO", name: "Rafael Oliveira", cpf: "•••.114.•••-65", bond: "Morador", status: "Aprovado", color: "green" },
];

export default function Home() {
  const [screen, setScreen] = useState<Screen>("visao");
  const [eventOpen, setEventOpen] = useState(true);
  const [checkin, setCheckin] = useState<"idle" | "scanning" | "success" | "manual">("idle");
  const [notice, setNotice] = useState("");

  const toast = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  return (
    <main>
      <aside className="sidebar">
        <div className="brand">
          <div className="brandmark">F<span>●</span></div>
          <div><strong>Festa do Peixe</strong><small>Prefeitura de Flórida</small></div>
        </div>
        <nav aria-label="Navegação principal">
          <button className={screen === "visao" ? "active" : ""} onClick={() => setScreen("visao")}><i>⌂</i> Visão geral</button>
          <button className={screen === "cadastros" ? "active" : ""} onClick={() => setScreen("cadastros")}><i>♙</i> Cadastros <b>3</b></button>
          <button className={screen === "checkin" ? "active" : ""} onClick={() => setScreen("checkin")}><i>⌾</i> Check-in</button>
          <button className={screen === "config" ? "active" : ""} onClick={() => setScreen("config")}><i>⚙</i> Configurações</button>
        </nav>
        <div className="privacy"><span>♢</span><p><strong>Dados protegidos</strong>Biometria criptografada e acesso auditado conforme a LGPD.</p></div>
        <div className="profile"><div className="avatar">LM</div><p><strong>Lucas Martins</strong><small>Administrador</small></p><button aria-label="Mais opções">•••</button></div>
      </aside>

      <section className="content">
        <header>
          <div><small>Festa do Peixe 2026</small><h1>{screen === "visao" ? "Visão geral" : screen === "cadastros" ? "Cadastros" : screen === "checkin" ? "Check-in do almoço" : "Configurações"}</h1></div>
          <div className="event-status"><span className={eventOpen ? "pulse" : "dot-off"}></span><p><small>Inscrições</small><strong>{eventOpen ? "Abertas" : "Pausadas"}</strong></p><button onClick={() => { setEventOpen(!eventOpen); toast(eventOpen ? "Inscrições pausadas" : "Inscrições reabertas"); }}>{eventOpen ? "Pausar" : "Reabrir"}</button></div>
        </header>

        {screen === "visao" && <>
          <section className="hero">
            <div><span className="eyebrow">DOMINGO, 18 DE OUTUBRO</span><h2>Almoço comunitário<br/>com controle e acolhimento.</h2><p>Cadastros validados por vínculo com Flórida. Reconhecimento facial usado somente para agilizar a conferência no evento.</p><button className="primary" onClick={() => setScreen("checkin")}>Abrir posto de check-in <span>→</span></button></div>
            <div className="fish-scene" aria-hidden="true"><div className="sun"></div><div className="fish"><span></span></div><div className="wave w1"></div><div className="wave w2"></div></div>
          </section>
          <div className="stats">
            <article><div className="stat-icon coral">♙</div><p><span>Inscritos</span><strong>1.248</strong><small><em>+12%</em> nesta semana</small></p></article>
            <article><div className="stat-icon green">✓</div><p><span>Cadastros aprovados</span><strong>1.086</strong><small>87% do total</small></p></article>
            <article><div className="stat-icon yellow">◷</div><p><span>Em análise</span><strong>162</strong><small>Requer atenção</small></p></article>
            <article><div className="stat-icon blue">▱</div><p><span>Capacidade</span><strong>2.000</strong><small>62% preenchida</small></p></article>
          </div>
          <section className="grid">
            <article className="panel recent">
              <div className="panel-head"><div><h3>Cadastros recentes</h3><p>Últimas solicitações recebidas</p></div><button onClick={() => setScreen("cadastros")}>Ver todos →</button></div>
              <div className="people">{people.map((person) => <div className="person" key={person.name}><div className={`person-avatar ${person.color}`}>{person.initials}</div><p><strong>{person.name}</strong><small>{person.cpf}</small></p><span className="bond">{person.bond}</span><span className={`tag ${person.status === "Aprovado" ? "approved" : "pending"}`}>{person.status}</span></div>)}</div>
            </article>
            <article className="panel eligibility"><div className="panel-head"><div><h3>Critérios de vínculo</h3><p>Como os aprovados comprovaram relação com a cidade</p></div></div><div className="donut"><div><strong>1.086</strong><span>aprovados</span></div></div><div className="legend"><p><i className="l-coral"></i>Morador <strong>58%</strong></p><p><i className="l-blue"></i>Eleitor <strong>27%</strong></p><p><i className="l-yellow"></i>Veículo emplacado <strong>15%</strong></p></div></article>
          </section>
        </>}

        {screen === "cadastros" && <section className="panel full">
          <div className="panel-head"><div><h3>Solicitações de participação</h3><p>Valide documentos e o vínculo declarado. A biometria nunca substitui esta análise.</p></div><button className="primary small" onClick={() => toast("Convite de cadastro copiado")}>+ Novo cadastro</button></div>
          <div className="filters"><input aria-label="Buscar cadastro" placeholder="Buscar por nome ou CPF"/><button>Todos</button><button>Pendentes</button><button>Aprovados</button></div>
          <div className="people detailed">{people.concat([{ initials:"CB", name:"Cláudia Barbosa", cpf:"•••.298.•••-03", bond:"Eleitora", status:"Em análise", color:"coral" }]).map((person) => <div className="person" key={person.name}><div className={`person-avatar ${person.color}`}>{person.initials}</div><p><strong>{person.name}</strong><small>{person.cpf}</small></p><span className="bond">{person.bond}</span><span className={`tag ${person.status === "Aprovado" ? "approved" : "pending"}`}>{person.status}</span><button className="review" onClick={() => toast(`Cadastro de ${person.name} aberto para conferência`)}>Revisar</button></div>)}</div>
        </section>}

        {screen === "checkin" && <section className="checkin-layout">
          <article className="camera-card">
            <div className={`camera ${checkin}`}>
              {checkin === "idle" && <><div className="face-frame">⌾</div><h3>Posto pronto</h3><p>Posicione o rosto da pessoa no centro</p></>}
              {checkin === "scanning" && <><div className="scan-line"></div><div className="face-frame">◎</div><h3>Conferindo cadastro…</h3><p>Comparação local e protegida</p></>}
              {checkin === "success" && <><div className="success-face">✓</div><h3>Mariana Alves</h3><p>Cadastro aprovado • Moradora</p><strong className="released">ALMOÇO LIBERADO</strong></>}
              {checkin === "manual" && <><div className="manual-icon">⌨</div><h3>Busca manual</h3><input autoFocus aria-label="CPF ou código" placeholder="Digite CPF ou código do convite"/><button className="primary" onClick={() => setCheckin("success")}>Conferir cadastro</button></>}
            </div>
            <div className="camera-actions"><button className="primary" onClick={() => { setCheckin("scanning"); window.setTimeout(() => setCheckin("success"), 1600); }}>Iniciar conferência facial</button><button onClick={() => setCheckin("manual")}>Usar CPF ou código</button></div>
          </article>
          <aside className="checkin-info"><span className="eyebrow">POSTO 01 • ENTRADA PRINCIPAL</span><h2>Atendimento rápido,<br/>sem deixar ninguém para trás.</h2><div className="today"><p><span>Check-ins hoje</span><strong>438</strong></p><p><span>Já utilizados</span><strong>0 duplicados</strong></p></div><div className="alert"><strong>Alternativa obrigatória</strong><p>Se a câmera falhar ou a pessoa não consentir com a biometria, faça a conferência por CPF, QR code e documento. Ninguém deve ser recusado apenas pela face.</p></div><button className="link" onClick={() => toast("Ocorrência registrada para análise")}>Registrar ocorrência →</button></aside>
        </section>}

        {screen === "config" && <section className="settings-grid">
          <article className="panel setting"><div className="setting-icon">◉</div><div><h3>Fonte de câmera</h3><p>Troque o equipamento sem alterar o restante do sistema.</p></div><label>Modo atual<select defaultValue="web"><option value="web">Webcam / tablet</option><option value="ip">Câmera IP (RTSP/ONVIF)</option><option value="mobile">Celular como câmera</option></select></label><button onClick={() => toast("Teste de câmera iniciado")}>Testar conexão</button></article>
          <article className="panel setting"><div className="setting-icon">⌁</div><div><h3>Validações oficiais</h3><p>Integrações dependem de autorização formal dos órgãos responsáveis.</p></div><div className="integration"><span>Residência municipal</span><b className="ok">Disponível</b></div><div className="integration"><span>Cadastro eleitoral</span><b>Pendente de convênio</b></div><div className="integration"><span>Veículo / IPVA</span><b>Pendente de convênio</b></div></article>
          <article className="panel setting"><div className="setting-icon">♢</div><div><h3>Privacidade e retenção</h3><p>Biometria é dado pessoal sensível e deve ter prazo mínimo de retenção.</p></div><label>Excluir biometria após<select defaultValue="30"><option>7 dias</option><option value="30">30 dias</option><option>Imediatamente após o evento</option></select></label><button onClick={() => toast("Política de privacidade aberta")}>Ver política</button></article>
          <article className="panel setting"><div className="setting-icon">⇩</div><div><h3>Relatório e auditoria</h3><p>Acompanhe decisões, acessos e atendimento por contingência.</p></div><button onClick={() => toast("Relatório de demonstração preparado")}>Gerar relatório do evento</button></article>
        </section>}
      </section>
      {notice && <div className="toast" role="status">✓ {notice}</div>}
    </main>
  );
}
