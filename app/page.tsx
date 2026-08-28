"use client";

import { useEffect, useRef, useState } from "react";

type Screen = "visao" | "cadastros" | "checkin" | "config";
type RegistrationMode = "unit" | "home";
type Portal = "resident" | "unit" | null;
type Person = { initials: string; name: string; cpf: string; cpfKey?: string; bond: string; status: string; color: string; document?: string; faceEnrolled?: boolean; faceImage?: string; invitationDelivered?: boolean };

const people = [
  { initials: "MA", name: "Mariana Alves", cpf: "•••.482.•••-10", bond: "Moradora", status: "Aprovado", color: "coral", faceEnrolled: true, invitationDelivered: true },
  { initials: "JS", name: "João da Silva", cpf: "•••.731.•••-42", bond: "Eleitor", status: "Aprovado", color: "blue", faceEnrolled: true, invitationDelivered: false },
  { initials: "AC", name: "Ana Costa", cpf: "•••.905.•••-18", bond: "IPVA em Flórida", status: "Aprovado", color: "yellow", faceEnrolled: false, invitationDelivered: false },
  { initials: "RO", name: "Rafael Oliveira", cpf: "•••.114.•••-65", bond: "Morador", status: "Aprovado", color: "green", faceEnrolled: true, invitationDelivered: true },
];

export default function Home() {
  const [screen, setScreen] = useState<Screen>("visao");
  const [portal, setPortal] = useState<Portal>(null);
  const [eventOpen, setEventOpen] = useState(true);
  const [checkin, setCheckin] = useState<"idle" | "camera" | "scanning" | "success" | "mismatch" | "manual" | "notfound">("idle");
  const [notice, setNotice] = useState("");
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationMode, setRegistrationMode] = useState<RegistrationMode>("unit");
  const [bondType, setBondType] = useState("Morador de Flórida");
  const [newPeople, setNewPeople] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [cameraActive, setCameraActive] = useState(false);
  const [faceCaptured, setFaceCaptured] = useState(false);
  const [facePreview, setFacePreview] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const checkinVideoRef = useRef<HTMLVideoElement>(null);
  const checkinStreamRef = useRef<MediaStream | null>(null);
  const [checkinTarget, setCheckinTarget] = useState<Person | null>(null);
  const [cpfQuery, setCpfQuery] = useState("");
  const [checkinScore, setCheckinScore] = useState(0);
  const [faceProfiles, setFaceProfiles] = useState<Record<string, { enrolled: boolean; image?: string }>>({});
  const [invitationUpdates, setInvitationUpdates] = useState<Record<string, boolean>>({});
  const [faceUpdatePerson, setFaceUpdatePerson] = useState<Person | null>(null);

  const toast = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  };
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => toast("Clique novamente em abrir câmera para iniciar a imagem"));
    }
  }, [cameraActive]);

  const openRegistration = (mode: RegistrationMode = "unit") => { setRegistrationMode(mode); setFaceCaptured(false); setFacePreview(""); setShowRegistration(true); };
  const closeRegistration = () => { stopCamera(); setShowRegistration(false); };
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 }, audio: false });
      streamRef.current = stream;
      setCameraActive(true);
    } catch { toast("Não foi possível abrir a câmera. Use a opção de anexar uma foto."); }
  };
  const captureFace = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) { toast("Aguarde a imagem da câmera aparecer antes de capturar"); return; }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (context) { context.translate(canvas.width, 0); context.scale(-1, 1); context.drawImage(video, 0, 0); setFacePreview(canvas.toDataURL("image/jpeg", .9)); }
    setFaceCaptured(true); stopCamera(); toast("Foto facial capturada para o cadastro");
  };

  const stopCheckinCamera = () => {
    checkinStreamRef.current?.getTracks().forEach((track) => track.stop());
    checkinStreamRef.current = null;
  };
  const startCheckinCamera = async (target: Person | null = null) => {
    try {
      stopCheckinCamera();
      setCheckinTarget(target);
      setCheckin("camera");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 }, audio: false });
      checkinStreamRef.current = stream;
      window.setTimeout(() => { if (checkinVideoRef.current) { checkinVideoRef.current.srcObject = stream; checkinVideoRef.current.play(); } }, 50);
    } catch { setCheckin("idle"); toast("Não foi possível abrir a câmera para a conferência"); }
  };
  const imageVector = (source: CanvasImageSource, width: number, height: number) => {
    const canvas = document.createElement("canvas"); canvas.width = 32; canvas.height = 32;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return [];
    const cropWidth = width * .52, cropHeight = height * .72;
    context.drawImage(source, (width - cropWidth) / 2, (height - cropHeight) / 2, cropWidth, cropHeight, 0, 0, 32, 32);
    const pixels = context.getImageData(0, 0, 32, 32).data;
    const values: number[] = [];
    for (let i = 0; i < pixels.length; i += 4) values.push(pixels[i] * .299 + pixels[i + 1] * .587 + pixels[i + 2] * .114);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const deviation = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length) || 1;
    return values.map((value) => (value - mean) / deviation);
  };
  const loadImage = (source: string) => new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = source; });
  const compareImages = async (reference: string, current: string) => {
    const [referenceImage, currentImage] = await Promise.all([loadImage(reference), loadImage(current)]);
    const a = imageVector(referenceImage, referenceImage.naturalWidth, referenceImage.naturalHeight);
    const b = imageVector(currentImage, currentImage.naturalWidth, currentImage.naturalHeight);
    if (!a.length || a.length !== b.length) return 0;
    const correlation = a.reduce((sum, value, index) => sum + value * b[index], 0) / a.length;
    return Math.max(0, Math.min(1, (correlation + 1) / 2));
  };
  const captureForCheckin = async () => {
    const video = checkinVideoRef.current;
    if (!video?.videoWidth) { toast("Aguarde a imagem da câmera aparecer"); return; }
    const canvas = document.createElement("canvas"); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.translate(canvas.width, 0); context.scale(-1, 1); context.drawImage(video, 0, 0);
    const currentImage = canvas.toDataURL("image/jpeg", .9);
    stopCheckinCamera();
    setCheckin("scanning");
    const candidates = checkinTarget ? [withCurrentControls(checkinTarget)] : allPeople.map(withCurrentControls).filter((person) => person.faceImage && (decisions[`${person.name}-${person.cpf}`] || person.status) !== "Recusado");
    if (!candidates.length) { window.setTimeout(() => { setCheckinScore(0); setCheckin("mismatch"); }, 900); return; }
    const results = await Promise.all(candidates.map(async (person) => ({ person, score: person.faceImage ? await compareImages(person.faceImage, currentImage) : 0 })));
    const best = results.sort((a, b) => b.score - a.score)[0];
    window.setTimeout(() => {
      setCheckinScore(best.score);
      if (best.score >= .74) { setCheckinTarget({ ...best.person, status: decisions[`${best.person.name}-${best.person.cpf}`] || best.person.status }); setCheckin("success"); }
      else setCheckin("mismatch");
    }, 900);
  };
  const findByCpf = () => {
    const digits = cpfQuery.replace(/\D/g, "");
    if (digits.length < 2) { toast("Digite o CPF ou o código do cadastro"); return; }
    const found = allPeople.find((item) => item.cpf.replace(/\D/g, "").endsWith(digits.slice(-2))) || (digits === "482" ? people[0] : null);
    const person = found ? withCurrentControls(found) : null;
    if (!person) { setCheckin("notfound"); return; }
    startCheckinCamera({ ...person, status: decisions[`${person.name}-${person.cpf}`] || person.status });
  };

  const requiredDocument: Record<string, string> = {
    "Morador de Flórida": "Conta de água, luz, telefone, contrato de aluguel ou declaração de residência",
    "Eleitor de Flórida": "Título de eleitor ou certidão eleitoral com domicílio em Flórida",
    "Veículo emplacado em Flórida": "CRLV atualizado do veículo",
    "Trabalha em Flórida": "Carteira de trabalho, holerite recente ou declaração assinada pelo empregador",
  };

  const submitRegistration = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    const cpf = String(data.get("cpf") || "").trim();
    const cpfKey = cpf.replace(/\D/g, "");
    const document = data.get("document") as File | null;
    if (!name || !cpf || !document?.name) {
      toast("Preencha os dados e anexe o comprovante do vínculo");
      return;
    }
    if (cpfKey.length !== 11) {
      toast("Digite um CPF válido com 11 dígitos");
      return;
    }
    if (newPeople.some((person) => person.cpfKey === cpfKey)) {
      toast("Este CPF já possui um cadastro municipal");
      return;
    }
    const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    setNewPeople((current) => [{ initials, name, cpf: `•••.${cpfKey.slice(-5, -2)}.•••-${cpfKey.slice(-2)}`, cpfKey, bond: bondType, status: registrationMode === "unit" ? "Aprovado" : "Em análise", color: "blue", document: document.name, faceEnrolled: faceCaptured, faceImage: faceCaptured ? facePreview : undefined, invitationDelivered: data.get("invitation") === "yes" }, ...current]);
    closeRegistration();
    toast(registrationMode === "unit" ? "Cadastro presencial aprovado e salvo na base municipal" : "Cadastro enviado para análise da prefeitura");
  };

  const decide = (person: Person, status: string) => {
    setDecisions((current) => ({ ...current, [`${person.name}-${person.cpf}`]: status }));
    setSelectedPerson(null);
    toast(status === "Aprovado" ? "Cadastro aprovado com sucesso" : status === "Correção solicitada" ? "Solicitação de correção enviada" : "Cadastro recusado e registrado no histórico");
  };

  const allPeople: Person[] = newPeople.concat(people, [{ initials:"CB", name:"Cláudia Barbosa", cpf:"•••.298.•••-03", bond:"Eleitora", status:"Aprovado", color:"coral", faceEnrolled:false, invitationDelivered:false }]);
  const personKey = (person: Person) => `${person.name}-${person.cpf}`;
  const withCurrentControls = (person: Person): Person => ({ ...person, faceEnrolled: faceProfiles[personKey(person)]?.enrolled ?? person.faceEnrolled, faceImage: faceProfiles[personKey(person)]?.image ?? person.faceImage, invitationDelivered: invitationUpdates[personKey(person)] ?? person.invitationDelivered });
  const setInvitation = (person: Person, delivered: boolean) => {
    setInvitationUpdates((current) => ({ ...current, [personKey(person)]: delivered }));
    setSelectedPerson((current) => current ? { ...current, invitationDelivered: delivered } : current);
    toast(delivered ? "Convite de 2027 marcado como entregue" : "Convite de 2027 marcado como não entregue");
  };

  return (
    <main className={portal === "unit" ? "" : "public-shell"}>
      {portal === null && <section className="portal-choice">
        <div className="portal-brand"><span className="fish-logo"><img src="/logo-festa-peixe.jpeg" alt=""/></span><div><strong>Festa do Peixe</strong><small>Prefeitura de Flórida</small></div></div>
        <div className="portal-intro"><span className="eyebrow">FESTA DO PEIXE</span><h1>Como você quer acessar?</h1><p>Escolha uma opção para continuar com segurança.</p></div>
        <div className="portal-options"><button onClick={() => { setPortal("resident"); openRegistration("home"); }}><span className="portal-icon">⌂</span><strong>Sou morador</strong><small>Fazer ou acompanhar meu cadastro pelo celular</small><b>Continuar →</b></button><button onClick={() => setPortal("unit")}><span className="portal-icon">▣</span><strong>Sou da prefeitura</strong><small>Acessar a área de uma unidade ou secretaria</small><b>Entrar na área interna →</b></button></div>
        <p className="portal-privacy">Seus dados são usados somente para o cadastro e a organização da festa.</p>
      </section>}
      {portal === "resident" && <section className="resident-portal">
        <button className="back-link" onClick={() => { closeRegistration(); setPortal(null); }}>← Voltar</button>
        <div className="resident-card"><span className="eyebrow">ÁREA DO MORADOR</span><h1>Seu cadastro para a Festa do Peixe</h1><p>Envie seus dados, um comprovante de vínculo com Flórida e sua foto. A prefeitura analisa tudo com segurança.</p><button className="primary resident-action" onClick={() => openRegistration("home")}>Começar cadastro <span>→</span></button><small>Você poderá acompanhar o resultado usando seu CPF ou número de cadastro.</small></div>
      </section>}
      {portal === "unit" && <>
      <aside className="sidebar">
        <div className="brand">
          <span className="fish-logo brand-logo"><img src="/logo-festa-peixe.jpeg" alt="" /></span>
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
          <div><small>Cadastro permanente • Festa do Peixe 2027</small><h1>{screen === "visao" ? "Visão geral" : screen === "cadastros" ? "Base municipal" : screen === "checkin" ? "Check-in do almoço" : "Configurações"}</h1></div>
          <div className="event-status"><span className={eventOpen ? "pulse" : "dot-off"}></span><p><small>Inscrições</small><strong>{eventOpen ? "Abertas" : "Pausadas"}</strong></p><button onClick={() => { setEventOpen(!eventOpen); toast(eventOpen ? "Inscrições pausadas" : "Inscrições reabertas"); }}>{eventOpen ? "Pausar" : "Reabrir"}</button></div>
        </header>

        {screen === "visao" && <>
          <section className="hero">
            <div><span className="eyebrow">BASE MUNICIPAL PERMANENTE</span><h2>Um cadastro único<br/>para todas as edições.</h2><p>Moradores e pessoas com vínculo são cadastrados uma vez, com comprovante e foto facial. Escolha como você vai fazer o cadastro.</p><div className="entry-actions"><button className="primary" onClick={() => { setScreen("cadastros"); openRegistration("home"); }}>Sou morador <span>→</span></button><button onClick={() => { setScreen("cadastros"); openRegistration("unit"); }}>Atendimento na unidade</button></div></div>
            <div className="fish-scene" aria-hidden="true"><div className="sun"></div><div className="fish"><span></span></div><div className="wave w1"></div><div className="wave w2"></div></div>
          </section>
          <div className="stats">
            <article><div className="stat-icon coral">♙</div><p><span>Pessoas na base</span><strong>1.248</strong><small><em>+12%</em> neste mês</small></p></article>
            <article><div className="stat-icon green">✓</div><p><span>Cadastros aprovados</span><strong>1.086</strong><small>87% do total</small></p></article>
            <article><div className="stat-icon yellow">◷</div><p><span>Em análise</span><strong>162</strong><small>Requer atenção</small></p></article>
            <article><div className="stat-icon blue">▱</div><p><span>Convites 2027 entregues</span><strong>782</strong><small>63% da base aprovada</small></p></article>
          </div>
          <section className="grid">
            <article className="panel recent">
              <div className="panel-head"><div><h3>Cadastros recentes</h3><p>Últimas solicitações recebidas</p></div><button onClick={() => setScreen("cadastros")}>Ver todos →</button></div>
              <div className="people">{people.map((person) => <div className="person" key={person.name}><div className={`person-avatar ${person.color}`}>{person.initials}</div><p><strong>{person.name}</strong><small>{person.cpf}</small></p><span className="bond">{person.bond}</span><span className={`tag ${person.status === "Aprovado" ? "approved" : "pending"}`}>{person.status}</span></div>)}</div>
            </article>
            <article className="panel eligibility"><div className="panel-head"><div><h3>Critérios de vínculo</h3><p>Como os aprovados comprovaram relação com a cidade</p></div></div><div className="donut"><div><strong>1.086</strong><span>aprovados</span></div></div><div className="legend"><p><i className="l-coral"></i>Morador <strong>48%</strong></p><p><i className="l-blue"></i>Eleitor <strong>24%</strong></p><p><i className="l-yellow"></i>Veículo emplacado <strong>13%</strong></p><p><i className="l-green"></i>Trabalha na cidade <strong>15%</strong></p></div></article>
          </section>
        </>}

        {screen === "cadastros" && <section className="panel full">
          <div className="panel-head"><div><h3>Cadastro municipal permanente</h3><p>Valide documentos, vínculo e captura facial. O convite é controlado separadamente por edição.</p></div><button className="primary small" onClick={openRegistration}>+ Novo cadastro</button></div>
          <div className="filters"><input aria-label="Buscar cadastro" placeholder="Buscar por nome ou CPF"/><button>Todos</button><button>Pendentes</button><button>Aprovados</button></div>
          <div className="people detailed">{allPeople.map((original) => { const person = withCurrentControls(original); const status = decisions[`${person.name}-${person.cpf}`] || person.status; return <div className="person" key={`${person.name}-${person.cpf}`}><div className={`person-avatar ${person.color}`}>{person.initials}</div><p><strong>{person.name}</strong><small>{person.cpf}{person.faceEnrolled ? " • Face cadastrada" : " • Face não cadastrada"}</small></p><span className="bond">{person.bond}<small className={person.invitationDelivered ? "invite yes" : "invite"}>{person.invitationDelivered ? "Convite 2027 entregue" : "Convite 2027 não entregue"}</small></span><span className={`tag ${status === "Aprovado" ? "approved" : status === "Recusado" ? "rejected" : "pending"}`}>{status}</span><button className="review" onClick={() => setSelectedPerson({ ...person, status })}>Abrir ficha</button></div>})}</div>
        </section>}

        {screen === "checkin" && <section className="checkin-layout">
          <article className="camera-card">
            <div className={`camera ${checkin}`}>
              {checkin === "idle" && <><div className="face-frame">⌾</div><h3>Posto pronto</h3><p>Posicione o rosto da pessoa no centro</p></>}
              {checkin === "camera" && <><video className="checkin-video" ref={checkinVideoRef} playsInline autoPlay muted/><div className="live-face-guide"></div><div className="live-label">● CÂMERA AO VIVO{checkinTarget ? ` • ${checkinTarget.name}` : ""}</div><button className="capture-checkin primary" onClick={captureForCheckin}>Capturar e comparar</button></>}
              {checkin === "scanning" && <><div className="scan-line"></div><div className="face-frame">◎</div><h3>Conferindo cadastro…</h3><p>Comparando a captura atual com a referência cadastrada</p></>}
              {checkin === "success" && <><div className="success-face">✓</div><h3>{checkinTarget?.name}</h3><p>Teste visual compatível • Cadastro {checkinTarget?.status.toLowerCase()} • {checkinTarget?.bond}</p><small className="match-score">Similaridade local: {(checkinScore * 100).toFixed(1)}%</small><strong className="released">IDENTIDADE CONFIRMADA</strong></>}
              {checkin === "mismatch" && <><div className="mismatch-face">×</div><h3>Rosto não confirmado</h3><p>{checkinTarget?.faceImage ? "A captura não corresponde à foto de referência desse cadastro." : "Não há uma referência facial real nesta sessão para fazer a comparação."}</p><small className="match-score">{checkinScore ? `Similaridade local: ${(checkinScore * 100).toFixed(1)}%` : "Cadastre a pessoa com uma foto antes de testar"}</small><strong className="blocked-result">NÃO LIBERADO</strong></>}
              {checkin === "manual" && <><div className="manual-icon">⌨</div><h3>Localizar cadastro</h3><p>Após localizar a ficha, a câmera será aberta para confirmar a identidade.</p><input autoFocus aria-label="CPF ou código" value={cpfQuery} onChange={(event) => setCpfQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") findByCpf(); }} placeholder="Digite CPF ou código do cadastro"/><button className="primary" onClick={findByCpf}>Localizar e abrir câmera</button></>}
              {checkin === "notfound" && <><div className="manual-icon error">!</div><h3>Cadastro não localizado</h3><p>Confira o CPF ou faça uma busca na base municipal.</p><button className="primary" onClick={() => setCheckin("manual")}>Tentar novamente</button></>}
            </div>
            <div className="camera-actions"><button className="primary" onClick={() => startCheckinCamera(null)}>Iniciar conferência facial</button><button onClick={() => { stopCheckinCamera(); setCheckin("manual"); }}>Usar CPF ou código</button><button onClick={() => { stopCheckinCamera(); setCheckinTarget(null); setCheckin("idle"); }}>Nova conferência</button></div>
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
      </>}
      {showRegistration && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeRegistration(); }}>
        <section className="registration-modal" role="dialog" aria-modal="true" aria-labelledby="registration-title">
            <div className="modal-head"><div><span className="eyebrow">{registrationMode === "home" ? "CADASTRO PELO CELULAR" : "ATENDIMENTO PRESENCIAL"}</span><h2 id="registration-title">{registrationMode === "home" ? "Faça seu cadastro" : "Cadastrar uma pessoa"}</h2><p>{registrationMode === "home" ? "Envie seus dados e comprovantes. A prefeitura vai analisar antes de aprovar." : "Este cadastro poderá ser utilizado nas próximas edições da Festa do Peixe."}</p></div><button aria-label="Fechar" onClick={closeRegistration}>×</button></div>
          <form onSubmit={submitRegistration}>
            <div className="form-grid"><label>Nome completo<input name="name" required placeholder="Ex.: Maria Aparecida Souza"/></label><label>CPF<input name="cpf" required inputMode="numeric" placeholder="000.000.000-00"/></label><label>Data de nascimento<input name="birth" required type="date"/></label><label>Telefone<input name="phone" required inputMode="tel" placeholder="(44) 99999-9999"/></label></div>
            <fieldset><legend>Qual é o vínculo com Flórida?</legend><div className="bond-options">
              {["Morador de Flórida", "Eleitor de Flórida", "Veículo emplacado em Flórida", "Trabalha em Flórida"].map((bond) => <label className={bondType === bond ? "selected" : ""} key={bond}><input type="radio" name="bond" value={bond} checked={bondType === bond} onChange={() => setBondType(bond)}/><span>{bond === "Morador de Flórida" ? "⌂" : bond === "Eleitor de Flórida" ? "✓" : bond === "Veículo emplacado em Flórida" ? "▱" : "▣"}</span><strong>{bond}</strong></label>)}
            </div></fieldset>
            <label className="upload"><span>⇧</span><div><strong>Anexe o comprovante obrigatório</strong><small>{requiredDocument[bondType]}</small><input name="document" required type="file" accept=".pdf,.jpg,.jpeg,.png"/></div></label>
            <fieldset className="face-enrollment"><legend>Cadastro facial <small>Opcional neste atendimento</small></legend><p>A pessoa pode fazer a captura agora ou ficar com o status “Face não cadastrada” para concluir depois.</p><div className={`face-capture ${faceCaptured ? "captured" : ""}`}>
              {cameraActive ? <><video className="checkin-video" ref={videoRef} playsInline autoPlay muted/><div className="live-face-guide"></div><div className="live-label">● CÂMERA AO VIVO • CADASTRO</div><button type="button" className="capture-checkin primary" onClick={captureFace}>Capturar foto</button></> : faceCaptured && facePreview ? <div className="photo-preview"><img src={facePreview} alt="Prévia da foto facial capturada"/><div className="captured-guide"></div><span>✓ Foto pronta</span></div> : <div className="camera-placeholder"><span>◎</span><strong>Posto de cadastro pronto</strong><small>Abra a câmera e posicione o rosto dentro do guia</small></div>}
            </div><div className="face-buttons">{!cameraActive && <button type="button" className={faceCaptured ? "" : "primary"} onClick={startCamera}>{faceCaptured ? "Refazer captura" : "Abrir câmera"}</button>}<label>Usar foto do aparelho<input type="file" accept="image/*" capture="user" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setFacePreview(URL.createObjectURL(file)); setFaceCaptured(true); stopCamera(); toast("Foto facial adicionada"); } }}/></label></div>{faceCaptured && <p className="preview-help">Confira a foto acima. Se estiver escura, cortada ou desfocada, clique em “Refazer captura”.</p>}</fieldset>
            {registrationMode === "unit" && <fieldset className="invitation-choice"><legend>Convite da Festa do Peixe 2027</legend><p>O cadastro continua válido mesmo que o convite ainda não tenha sido entregue.</p><div><label><input type="radio" name="invitation" value="no" defaultChecked/> Ainda não foi entregue</label><label><input type="radio" name="invitation" value="yes"/> Convite entregue agora</label></div></fieldset>}
            <label className="consent"><input required type="checkbox"/> {registrationMode === "home" ? "Autorizo o uso dos dados para análise do cadastro e declaro que as informações são verdadeiras" : "Confirmo que os documentos foram conferidos presencialmente e que a pessoa autorizou o uso dos dados informados"}{faceCaptured ? " e da referência facial" : ""}.</label>
            <div className="modal-actions"><button type="button" onClick={closeRegistration}>Cancelar</button><button className="primary" type="submit">{registrationMode === "home" ? "Enviar para análise →" : "Salvar cadastro →"}</button></div>
          </form>
        </section>
      </div>}
      {faceUpdatePerson && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { stopCamera(); setFaceUpdatePerson(null); } }}><section className="face-update-modal" role="dialog" aria-modal="true"><div className="modal-head"><div><span className="eyebrow">IDENTIFICAÇÃO FACIAL</span><h2>Cadastrar face de {faceUpdatePerson.name}</h2><p>A imagem ficará vinculada ao cadastro municipal permanente.</p></div><button onClick={() => { stopCamera(); setFaceUpdatePerson(null); }}>×</button></div><div className={`face-capture ${faceCaptured ? "captured" : ""}`}>{cameraActive ? <><video className="checkin-video" ref={videoRef} playsInline autoPlay muted/><div className="live-face-guide"></div><div className="live-label">● CÂMERA AO VIVO • CADASTRO</div><button type="button" className="capture-checkin primary" onClick={captureFace}>Capturar foto</button></> : faceCaptured && facePreview ? <div className="photo-preview"><img src={facePreview} alt="Prévia da face"/><div className="captured-guide"></div><span>✓ Foto pronta</span></div> : <div className="camera-placeholder"><span>◎</span><strong>Posicione o rosto dentro do guia</strong><small>A pessoa deve olhar diretamente para a câmera</small></div>}</div><div className="face-update-actions"><button onClick={startCamera}>{faceCaptured ? "Refazer captura" : "Abrir câmera"}</button><button className="primary" disabled={!faceCaptured} onClick={() => { if (!faceCaptured) return; setFaceProfiles((current) => ({ ...current, [personKey(faceUpdatePerson)]: { enrolled:true, image:facePreview } })); setFaceUpdatePerson(null); toast("Referência facial cadastrada com sucesso"); }}>Salvar referência facial</button></div></section></div>}
      {selectedPerson && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedPerson(null); }}>
        <section className="review-sheet" role="dialog" aria-modal="true" aria-labelledby="review-title">
          <div className="sheet-head"><div className={`sheet-avatar ${selectedPerson.color}`}>{selectedPerson.initials}</div><div><span className="eyebrow">FICHA DE ANÁLISE</span><h2 id="review-title">{selectedPerson.name}</h2><p>Solicitação nº FP-2026-{selectedPerson.cpf.replace(/\D/g, "").slice(-4) || "0184"}</p></div><button aria-label="Fechar" onClick={() => setSelectedPerson(null)}>×</button></div>
          <div className="sheet-status"><span className={`tag ${selectedPerson.status === "Aprovado" ? "approved" : selectedPerson.status === "Recusado" ? "rejected" : "pending"}`}>{selectedPerson.status}</span><small>Cadastro recebido em 03/08/2026 às 14:32</small></div>
          <div className="sheet-body">
            <section><h3>Dados pessoais</h3><div className="data-grid"><p><span>Nome completo</span><strong>{selectedPerson.name}</strong></p><p><span>CPF</span><strong>{selectedPerson.cpf}</strong></p><p><span>Data de nascimento</span><strong>18/05/1987</strong></p><p><span>Telefone</span><strong>(44) 99942-0184</strong></p><p className="wide"><span>Endereço informado</span><strong>Rua das Palmeiras, 128 — Centro, Flórida/PR</strong></p></div></section>
            <section><h3>Vínculo com Flórida</h3><div className="bond-proof"><div className="proof-icon">{selectedPerson.bond.toLowerCase().includes("trabalha") ? "▣" : selectedPerson.bond.toLowerCase().includes("eleitor") ? "✓" : selectedPerson.bond.toLowerCase().includes("ipva") || selectedPerson.bond.toLowerCase().includes("veículo") ? "▱" : "⌂"}</div><div><small>Vínculo declarado</small><strong>{selectedPerson.bond}</strong><span>Documento obrigatório apresentado</span></div></div></section>
            <section><h3>Identificação facial</h3><div className="facial-control"><div><span>◎</span><p><small>Referência facial</small><strong>{selectedPerson.faceEnrolled ? "Cadastrada" : "Não cadastrada"}</strong></p></div>{selectedPerson.faceEnrolled ? <button onClick={() => { setSelectedPerson(null); setFaceUpdatePerson(selectedPerson); setFaceCaptured(false); setFacePreview(""); }}>Atualizar foto</button> : <button className="primary" onClick={() => { setSelectedPerson(null); setFaceUpdatePerson(selectedPerson); setFaceCaptured(false); setFacePreview(""); }}>Cadastrar face</button>}</div></section>
            <section><h3>Convite por edição</h3><div className="current-invitation"><div><span>▱</span><p><small>Festa do Peixe 2027</small><strong>{selectedPerson.invitationDelivered ? "Convite entregue" : "Convite não entregue"}</strong></p></div><div className="invite-actions"><button className={!selectedPerson.invitationDelivered ? "active" : ""} onClick={() => setInvitation(selectedPerson, false)}>Não entregue</button><button className={selectedPerson.invitationDelivered ? "active delivered" : ""} onClick={() => setInvitation(selectedPerson, true)}>✓ Entregue</button></div></div><div className="event-history"><h4>Histórico de convites</h4><div><span>2027</span><strong>{selectedPerson.invitationDelivered ? "Entregue em 03/08/2026" : "Não entregue"}</strong></div><div><span>2026</span><strong>Entregue em 12/09/2025</strong></div><div><span>2025</span><strong>Não participou</strong></div></div></section>
            <section><h3>Comprovante anexado</h3><button className="document-card" onClick={() => toast(`Visualização de ${selectedPerson.document || "comprovante-vinculo.pdf"} aberta`)}><span>PDF</span><div><strong>{selectedPerson.document || (selectedPerson.bond.toLowerCase().includes("trabalha") ? "declaracao-empregador.pdf" : "comprovante-vinculo.pdf")}</strong><small>Documento enviado pelo participante • 1,2 MB</small></div><b>Visualizar ↗</b></button></section>
            <section className="audit"><h3>Conferência</h3><label>Observação do analista<textarea placeholder="Registre aqui qualquer divergência ou justificativa da decisão"></textarea></label><p>◷ Toda decisão fica registrada com data, horário e administrador responsável.</p></section>
          </div>
          <div className="sheet-actions"><span>Cadastro presencial aprovado pela secretaria</span><button className="approve" onClick={() => setSelectedPerson(null)}>Fechar ficha</button></div>
        </section>
      </div>}
      {notice && <div className="toast" role="status">✓ {notice}</div>}
    </main>
  );
}
