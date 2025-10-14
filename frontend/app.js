const META_DIARIA_MINUTOS = 60;
const RECOMPENSA_MINUTO_NORMAL = 1; 
const RECOMPENSA_MINUTO_EXTRA = 0.5; 

let tempoEstudadoSegundos = 0;
let tempoRedeSocialSegundos = 0;
let cronometroEstudoInterval = null;
let cronometroGastarInterval = null;

const $cronometroEstudo = document.getElementById('cronometro-estudo');
const $tempoRedeSocial = document.getElementById('tempo-rede-social');
const $tempoEstudadoDisplay = document.getElementById('tempo-estudado-display');
const $avisoGastando = document.getElementById('aviso-gastando');

const $btnIniciarEstudo = document.getElementById('iniciar-estudo');
const $btnPararEstudo = document.getElementById('parar-estudo');
const $btnGastarTempo = document.getElementById('gastar-tempo');

const $metaContainer = document.getElementById('metas-container');

const $scrollDownButton = document.getElementById('scroll-down-button');
const $appContainer = document.getElementById('app-container');
const $fixedHeader = document.getElementById('fixed-header');
const $closeButton = document.getElementById('close-button');

function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const pad = (num) => String(num).padStart(2, '0');
    
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function formatTimeMinutes(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    if (minutes === 0 && totalSeconds > 0) return "Menos de 1 minuto";
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
}

function carregarEstado() {
    const dadosSalvos = localStorage.getItem('produtividadeData');
    if (dadosSalvos) {
        const data = JSON.parse(dadosSalvos);
        
        const hoje = new Date().toDateString();
        
        if (data.dataUltimoAcesso === hoje) {
             tempoEstudadoSegundos = data.tempoEstudadoSegundos || 0;
             tempoRedeSocialSegundos = data.tempoRedeSocialSegundos || 0;
        } else {
             tempoEstudadoSegundos = 0;
             tempoRedeSocialSegundos = data.tempoRedeSocialSegundos || 0;
        }
    }
    atualizarUI();
}

function salvarEstado() {
    const estado = {
        tempoEstudadoSegundos: tempoEstudadoSegundos,
        tempoRedeSocialSegundos: tempoRedeSocialSegundos,
        dataUltimoAcesso: new Date().toDateString()
    };
    localStorage.setItem('produtividadeData', JSON.stringify(estado));
}

function atualizarUI() {
    const tempoEstudadoMinutos = Math.floor(tempoEstudadoSegundos / 60);

    $cronometroEstudo.textContent = formatTime(tempoEstudadoSegundos);
    $tempoRedeSocial.textContent = formatTimeMinutes(tempoRedeSocialSegundos);
    
    $tempoEstudadoDisplay.textContent = tempoEstudadoMinutos;

    if (tempoEstudadoMinutos >= META_DIARIA_MINUTOS) {
        $metaContainer.classList.add('meta-batida'); 
    } else {
        $metaContainer.classList.remove('meta-batida');
    }
    
    const podeGastar = tempoRedeSocialSegundos >= 60 && !cronometroGastarInterval;
    $btnGastarTempo.disabled = !podeGastar; 
    
    salvarEstado();
}

function iniciarEstudo() {
    if (cronometroEstudoInterval) return;

    $btnIniciarEstudo.disabled = true;
    $btnPararEstudo.disabled = false;
    $btnGastarTempo.disabled = true; 

    cronometroEstudoInterval = setInterval(() => {
        tempoEstudadoSegundos++;
        
        const tempoEstudadoMinutos = Math.floor(tempoEstudadoSegundos / 60);
        
        let ganhoSegundos = 0;
        
        if (tempoEstudadoSegundos > 0 && tempoEstudadoSegundos % 60 === 0) {
             
            if (tempoEstudadoMinutos <= META_DIARIA_MINUTOS) {
                ganhoSegundos = RECOMPENSA_MINUTO_NORMAL * 60; 
            } else {
                ganhoSegundos = RECOMPENSA_MINUTO_EXTRA * 60;
            }
             tempoRedeSocialSegundos += ganhoSegundos;
        }

        atualizarUI();

    }, 1000);
}

function pararEstudo() {
    clearInterval(cronometroEstudoInterval);
    cronometroEstudoInterval = null;
    $btnIniciarEstudo.disabled = false;
    $btnPararEstudo.disabled = true;
    atualizarUI(); 
}

function gastarTempo() {
    if (cronometroGastarInterval) return;

    $btnGastarTempo.textContent = 'Tempo Regressivo...';
    $btnGastarTempo.disabled = true;
    $btnIniciarEstudo.disabled = true;
    $avisoGastando.textContent = "Seu tempo está diminuindo. Use-o com sabedoria!";

    cronometroGastarInterval = setInterval(() => {
        if (tempoRedeSocialSegundos > 0) {
            tempoRedeSocialSegundos--;
            atualizarUI();
        } else {
            clearInterval(cronometroGastarInterval);
            cronometroGastarInterval = null;
            
            $btnGastarTempo.textContent = 'Usar Tempo';
            $btnIniciarEstudo.disabled = false;
            $avisoGastando.textContent = "Tempo de rede social esgotado. Hora de voltar aos estudos!";
            
            atualizarUI();
        }
    }, 1000);
}

function smoothScrollToApp() {
    if (!$appContainer) return;
    
    const targetPosition = $appContainer.offsetTop; 
    
    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });

    if ($fixedHeader) {
        $fixedHeader.classList.add('is-visible');
    }

    setTimeout(() => {
        document.documentElement.style.overflow = 'auto';
        document.body.style.overflow = 'auto';
    }, 800); 
}

function returnToHero() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    if ($fixedHeader) {
        $fixedHeader.classList.remove('is-visible');
    }

    setTimeout(() => {
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
    }, 700);
}


$btnIniciarEstudo.addEventListener('click', iniciarEstudo);
$btnPararEstudo.addEventListener('click', pararEstudo);
$btnGastarTempo.addEventListener('click', gastarTempo);

if ($scrollDownButton) {
    $scrollDownButton.addEventListener('click', smoothScrollToApp);
}

if ($closeButton) {
    $closeButton.addEventListener('click', returnToHero);
}

window.addEventListener('load', () => {
    document.documentElement.style.overflow = 'hidden'; 
    document.body.style.overflow = 'hidden'; 
    
    carregarEstado();
});