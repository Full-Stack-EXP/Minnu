const META_DIARIA_MINUTOS = 60; 
const RECOMPENSA_MINUTO_NORMAL = 1; 
const RECOMPENSA_MINUTO_EXTRA = 0.5; 

let tempoEstudadoSegundos = 0;
let tempoRedeSocialSegundos = 0;
let cronometroEstudoInterval = null;
let allActivities = []; 
let todayActivities = [];

const $scrollDownButton = document.getElementById('scroll-down-button');
const $fixedHeader = document.getElementById('fixed-header');
const $closeButton = document.getElementById('close-button');

const $allActivitiesList = document.getElementById('all-items-list');
const $todayStudyList = document.getElementById('today-study-list');
const $addItemButton = document.getElementById('add-item-button');
const $nextScreen2 = document.getElementById('next-screen-2');

const $totalHoursInput = document.getElementById('total-hours');
const $totalWeightDisplay = document.getElementById('total-weight-display');
const $calculatedTimesList = document.getElementById('calculated-times-list');
const $backScreen3 = document.getElementById('back-screen-3');
const $nextScreen3 = document.getElementById('next-screen-3');

const $activitySelector = document.getElementById('activity-selector');
const $studyInfoCard = document.getElementById('study-info-card');
const $currentActivityName = document.getElementById('current-activity-name');
const $currentActivityWeight = document.getElementById('current-activity-weight');
const $currentActivityTarget = document.getElementById('current-activity-target');
const $cronometroEstudo = document.getElementById('cronometro-estudo');
const $tempoRedeSocial = document.getElementById('tempo-rede-social');
const $btnIniciarEstudo = document.getElementById('iniciar-estudo');
const $btnPararEstudo = document.getElementById('parar-estudo');
const $btnGastarTempo = document.getElementById('gastar-tempo');
const $avisoGastando = document.getElementById('aviso-gastando');
const $backScreen4 = document.getElementById('back-screen-4');

let currentStudyActivityId = null; 
let currentActivityData = null; 

function carregarEstado() {
    const dadosSalvos = localStorage.getItem('minnuData');
    if (dadosSalvos) {
        const data = JSON.parse(dadosSalvos);
        
        const hoje = new Date().toDateString();
        
        if (data.dataUltimoAcesso === hoje) {
             tempoEstudadoSegundos = data.tempoEstudadoSegundos || 0;
             tempoRedeSocialSegundos = data.tempoRedeSocialSegundos || 0;
             todayActivities = data.todayActivities || [];
        } else {
             tempoEstudadoSegundos = 0; 
             tempoRedeSocialSegundos = data.tempoRedeSocialSegundos || 0; 
             todayActivities = []; 
        }

        allActivities = data.allActivities || [
            { id: 1, name: "Matemática", weight: 8 },
            { id: 2, name: "Programação", weight: 10 },
            { id: 3, name: "Leitura", weight: 5 },
        ];
    }

    atualizarTudo();
}

function salvarEstado() {
    const estado = {
        tempoEstudadoSegundos: tempoEstudadoSegundos,
        tempoRedeSocialSegundos: tempoRedeSocialSegundos,
        allActivities: allActivities,
        todayActivities: todayActivities,
        dataUltimoAcesso: new Date().toDateString()
    };
    localStorage.setItem('minnuData', JSON.stringify(estado));
}

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

function roundToNearestTenMinutes(minutes) {
    return Math.round(minutes / 10) * 10;
}

function renderActivities() {
    $allActivitiesList.innerHTML = '';
    $todayStudyList.innerHTML = '';

    const todayIds = todayActivities.map(a => a.id);

    allActivities.forEach(activity => {
        const isToday = todayIds.includes(activity.id);
        const list = isToday ? $todayStudyList : $allActivitiesList;
        
        const weightDisplay = isToday ? `(Peso: ${activity.weight})` : `Peso: ${activity.weight}`;
        
        const item = document.createElement('div');
        item.className = 'list-item';
        item.dataset.id = activity.id;
        item.draggable = true;
        item.innerHTML = `
            <span class="item-name" contenteditable="true">${activity.name}</span>
            <div class="item-controls">
                <input type="number" class="item-weight" min="1" max="10" value="${activity.weight}">
                <button class="btn-move" data-action="${isToday ? 'remove' : 'add'}">
                    ${isToday ? '←' : '→'}
                </button>
                <button class="btn-delete" data-id="${activity.id}">🗑</button>
            </div>
        `;
        
        list.appendChild(item);
    });
    
    if (allActivities.length === 0) {
        $allActivitiesList.innerHTML = '<p class="placeholder-text">Adicione suas metas de estudo/foco.</p>';
    }
    if (todayActivities.length === 0) {
        $todayStudyList.innerHTML = '<p class="placeholder-text">Mova itens importantes para cá.</p>';
    }
}

function handleItemAction(e) {
    const target = e.target;
    const itemElement = target.closest('.list-item');
    if (!itemElement) return;

    const id = parseInt(itemElement.dataset.id);
    let activity = allActivities.find(a => a.id === id);
    if (!activity) return;

    if (target.classList.contains('btn-move')) {
        const action = target.dataset.action;
        if (action === 'add' && !todayActivities.some(a => a.id === id)) {
            todayActivities.push(activity);
        } else if (action === 'remove') {
            todayActivities = todayActivities.filter(a => a.id !== id);
        }
    } 
    else if (target.classList.contains('btn-delete')) {
        allActivities = allActivities.filter(a => a.id !== id);
        todayActivities = todayActivities.filter(a => a.id !== id);
    } 
    else if (target.classList.contains('item-name')) {
    } 
    else if (target.classList.contains('item-weight')) {
        activity.weight = parseInt(target.value) || 1;
    }

    salvarEstado();
    renderActivities();
    calculateAndRenderTimes();
}

$allActivitiesList.addEventListener('blur', (e) => {
    if (e.target.classList.contains('item-name')) {
        const id = parseInt(e.target.closest('.list-item').dataset.id);
        const activity = allActivities.find(a => a.id === id);
        if (activity) {
            activity.name = e.target.textContent.trim();
            salvarEstado();
        }
    }
}, true); 

$todayStudyList.addEventListener('blur', (e) => {
    if (e.target.classList.contains('item-name')) {
        const id = parseInt(e.target.closest('.list-item').dataset.id);
        const activity = allActivities.find(a => a.id === id);
        if (activity) {
            activity.name = e.target.textContent.trim();
            salvarEstado();
        }
    }
}, true); 


function addItem() {
    const newId = allActivities.length > 0 ? Math.max(...allActivities.map(a => a.id)) + 1 : 1;
    const newItem = {
        id: newId,
        name: `Nova Atividade ${newId}`,
        weight: 5
    };
    allActivities.push(newItem);
    salvarEstado();
    renderActivities();
}

function calculateAndRenderTimes() {
    const totalHours = parseInt($totalHoursInput.value) || 0;
    const totalMinutes = totalHours * 60;
    
    let totalWeight = todayActivities.reduce((sum, activity) => {
        const fullActivity = allActivities.find(a => a.id === activity.id);
        return sum + (fullActivity ? fullActivity.weight : 0);
    }, 0);
    
    $totalWeightDisplay.textContent = `Total de Peso: ${totalWeight}`;
    $calculatedTimesList.innerHTML = '';
    
    if (totalWeight === 0 || totalHours === 0) {
        $calculatedTimesList.innerHTML = '<p class="placeholder-text">Defina horas e mova itens para calcular.</p>';
        return;
    }
    
    todayActivities.forEach(activity => {
        const fullActivity = allActivities.find(a => a.id === activity.id);
        if (!fullActivity) return;

        const activityWeight = fullActivity.weight;
        const rawTime = (activityWeight / totalWeight) * totalMinutes;
        const finalTime = roundToNearestTenMinutes(rawTime);
        
        const p = document.createElement('p');
        p.textContent = `${fullActivity.name} (Peso ${activityWeight}): ${finalTime} minutos`;
        $calculatedTimesList.appendChild(p);
    });

    populateActivitySelector();
}

function populateActivitySelector() {
    $activitySelector.innerHTML = '<option value="">Selecione uma atividade</option>';
    todayActivities.forEach(activity => {
        const option = document.createElement('option');
        option.value = activity.id;
        
        const fullActivity = allActivities.find(a => a.id === activity.id);
        if (fullActivity) {
            option.textContent = `${fullActivity.name} (Peso ${fullActivity.weight})`;
        }
        $activitySelector.appendChild(option);
    });
    
    $currentActivityName.textContent = 'Nenhuma';
    $currentActivityWeight.textContent = '0';
    $currentActivityTarget.textContent = '0 min';
    currentStudyActivityId = null;
    currentActivityData = null;
}

function handleActivitySelection(e) {
    const selectedId = parseInt(e.target.value);
    
    if (!selectedId) {
        currentActivityData = null;
        $studyInfoCard.style.display = 'none';
        return;
    }
    
    const activity = todayActivities.find(a => a.id === selectedId);
    if (!activity) return;

    const totalHours = parseInt($totalHoursInput.value) || 0;
    const totalMinutes = totalHours * 60;
    let totalWeight = todayActivities.reduce((sum, a) => {
        const full = allActivities.find(item => item.id === a.id);
        return sum + (full ? full.weight : 0);
    }, 0);
    
    const fullActivity = allActivities.find(a => a.id === activity.id);
    const rawTime = (fullActivity.weight / totalWeight) * totalMinutes;
    const targetTime = roundToNearestTenMinutes(rawTime);

    currentStudyActivityId = selectedId;
    currentActivityData = { ...fullActivity, targetTime: targetTime };

    $currentActivityName.textContent = currentActivityData.name;
    $currentActivityWeight.textContent = currentActivityData.weight;
    $currentActivityTarget.textContent = `${currentActivityData.targetTime} min`;
    $studyInfoCard.style.display = 'block';
}

function atualizarUI() {
    const tempoEstudadoMinutos = Math.floor(tempoEstudadoSegundos / 60);

    $cronometroEstudo.textContent = formatTime(tempoEstudadoSegundos);
    $tempoRedeSocial.textContent = formatTimeMinutes(tempoRedeSocialSegundos);
    
    const podeGastar = tempoRedeSocialSegundos >= 60 && !cronometroEstudoInterval;
    $btnGastarTempo.disabled = !podeGastar; 
    
    salvarEstado();
}


function iniciarEstudo() {
    if (cronometroEstudoInterval || !currentStudyActivityId) return;

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
    if (tempoRedeSocialSegundos >= 60) {
        tempoRedeSocialSegundos -= 60; 
        $avisoGastando.textContent = "1 minuto de tempo social gasto. Saldo atualizado.";
        setTimeout(() => $avisoGastando.textContent = '', 2000);
    }
    atualizarUI();
}

let currentScreen = 1;

function scrollToScreen(screenNumber) {
    const targetScreen = document.getElementById(`screen-${screenNumber}`);
    if (!targetScreen) return;
    
    currentScreen = screenNumber;
    
    window.scrollTo({
        top: targetScreen.offsetTop,
        behavior: 'smooth'
    });

    if (screenNumber > 1 && $fixedHeader) {
        $fixedHeader.classList.add('is-visible');
    } else if (screenNumber === 1 && $fixedHeader) {
        $fixedHeader.classList.remove('is-visible');
    }

    setTimeout(() => {
        document.documentElement.style.overflow = 'auto';
        document.body.style.overflow = 'auto';
    }, 800);
}

function returnToHero() {
    currentScreen = 1;
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

function atualizarTudo() {
    renderActivities();
    calculateAndRenderTimes();
    atualizarUI();
}

$allActivitiesList.addEventListener('click', handleItemAction);
$todayStudyList.addEventListener('click', handleItemAction);
$addItemButton.addEventListener('click', addItem);
$nextScreen2.addEventListener('click', () => scrollToScreen(3));

$totalHoursInput.addEventListener('input', calculateAndRenderTimes);
$backScreen3.addEventListener('click', () => scrollToScreen(2));
$nextScreen3.addEventListener('click', () => scrollToScreen(4));

$activitySelector.addEventListener('change', handleActivitySelection);
$btnIniciarEstudo.addEventListener('click', iniciarEstudo);
$btnPararEstudo.addEventListener('click', pararEstudo);
$btnGastarTempo.addEventListener('click', gastarTempo);
$backScreen4.addEventListener('click', () => scrollToScreen(3));


if ($scrollDownButton) {
    $scrollDownButton.addEventListener('click', () => scrollToScreen(2)); 
}
if ($closeButton) {
    $closeButton.addEventListener('click', returnToHero);
}

window.addEventListener('load', () => {
    document.documentElement.style.overflow = 'hidden'; 
    document.body.style.overflow = 'hidden'; 
    
    carregarEstado();
});