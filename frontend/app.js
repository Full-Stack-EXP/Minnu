document.addEventListener('DOMContentLoaded', () => {
    const RECOMPENSA_MINUTO_NORMAL = 1; 
    let tempoEstudadoHojeSegundos = 0; 
    let tempoRedeSocialSegundos = 0;
    let cronometroEstudoInterval = null;
    let allActivities = []; 
    let todayActivities = []; 

    let currentStudyActivityId = null;

    const $scrollDownButton = document.getElementById('scroll-down-button');
    const $fixedHeader = document.getElementById('fixed-header');
    const $closeButton = document.getElementById('close-button');

    const $allActivitiesList = document.getElementById('all-items-list');
    const $todayStudyList = document.getElementById('today-study-list');
    const $newItemNameInput = document.getElementById('new-item-name');
    const $addItemButton = document.getElementById('add-item-button');
    const $nextScreen2 = document.getElementById('next-screen-2');

    const $totalHoursInput = document.getElementById('total-hours');
    const $totalWeightDisplay = document.getElementById('total-weight-display');
    const $calculatedTimesList = document.getElementById('calculated-times-list');
    const $backScreen3 = document.getElementById('back-screen-3');
    const $nextScreen3 = document.getElementById('next-screen-3');

    const $cronometroEstudo = document.getElementById('cronometro-estudo');
    const $currentActivityName = document.getElementById('current-activity-name');
    const $currentActivityWeight = document.getElementById('current-activity-weight');
    const $currentActivityTarget = document.getElementById('current-activity-target');
    const $currentActivitySpent = document.getElementById('current-activity-spent');
    const $progressBar = document.getElementById('progress-bar');
    const $executionTodayList = document.getElementById('execution-today-list');
    const $btnIniciarEstudo = document.getElementById('iniciar-estudo');
    const $btnPararEstudo = document.getElementById('parar-estudo');
    const $tempoRedeSocial = document.getElementById('tempo-rede-social');
    const $btnGastarTempo = document.getElementById('gastar-tempo');
    const $avisoGastando = document.getElementById('aviso-gastando');
    const $backScreen4 = document.getElementById('back-screen-4');

    function carregarEstado() {
        const dadosSalvos = localStorage.getItem('minnuData');
        if (dadosSalvos) {
            const data = JSON.parse(dadosSalvos);
            const hoje = new Date().toDateString();
            
            allActivities = data.allActivities || [];
            tempoRedeSocialSegundos = data.tempoRedeSocialSegundos || 0;

            if (data.dataUltimoAcesso === hoje) {
                tempoEstudadoHojeSegundos = data.tempoEstudadoHojeSegundos || 0;
                todayActivities = data.todayActivities || [];
            } else {
                todayActivities = data.todayActivities.map(act => ({ ...act, timeSpent: 0 })) || [];
            }
        } else {
            allActivities = [
                { id: 1, name: "Estudar JavaScript", weight: 10 },
                { id: 2, name: "Projeto Pessoal", weight: 8 },
                { id: 3, name: "Leitura Técnica", weight: 5 },
            ];
        }
        atualizarTudo();
    }

    function salvarEstado() {
        const estado = {
            tempoEstudadoHojeSegundos,
            tempoRedeSocialSegundos,
            allActivities,
            todayActivities,
            dataUltimoAcesso: new Date().toDateString()
        };
        localStorage.setItem('minnuData', JSON.stringify(estado));
    }

    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const pad = (num) => String(num).padStart(2, '0');
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    };
    const formatTimeMinutes = (totalSeconds) => `${Math.floor(totalSeconds / 60)} minutos`;
    const roundToNearestTenMinutes = (minutes) => Math.round(minutes / 10) * 10;

    function renderAll() {
        renderActivitiesLists();
        calculateAndRenderTimes();
        renderExecutionScreen();
        updateUI();
    }

    function renderActivitiesLists() {
        $allActivitiesList.innerHTML = '';
        $todayStudyList.innerHTML = '';
        const todayIds = todayActivities.map(a => a.id);

        const allButToday = allActivities.filter(a => !todayIds.includes(a.id));

        if (allButToday.length === 0) {
            $allActivitiesList.innerHTML = '<p class="placeholder-text">Adicione ou mova atividades aqui.</p>';
        } else {
            allButToday.forEach(activity => $allActivitiesList.appendChild(createActivityElement(activity, false)));
        }
        
        if (todayActivities.length === 0) {
            $todayStudyList.innerHTML = '<p class="placeholder-text">Mova itens importantes para cá.</p>';
        } else {
            todayActivities.forEach(activity => $todayStudyList.appendChild(createActivityElement(activity, true)));
        }
    }

    function createActivityElement(activity, isToday) {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.dataset.id = activity.id;
        
        item.innerHTML = `
            <input class="item-name" value="${activity.name}">
            <div class="item-controls">
                <span>Peso:</span>
                <input type="number" class="item-weight" min="1" max="10" value="${activity.weight}">
                <button class="btn-move" data-action="${isToday ? 'remove' : 'add'}">${isToday ? '←' : '→'}</button>
                <button class="btn-delete"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;

        item.querySelector('.item-name').addEventListener('change', (e) => updateActivity(activity.id, 'name', e.target.value));
        item.querySelector('.item-weight').addEventListener('change', (e) => updateActivity(activity.id, 'weight', parseInt(e.target.value)));
        item.querySelector('.btn-move').addEventListener('click', () => moveActivity(activity.id));
        item.querySelector('.btn-delete').addEventListener('click', () => deleteActivity(activity.id));

        return item;
    }

    function calculateAndRenderTimes() {
        const totalHours = parseFloat($totalHoursInput.value) || 0;
        const totalMinutes = totalHours * 60;
        const totalWeight = todayActivities.reduce((sum, act) => sum + act.weight, 0);

        $totalWeightDisplay.textContent = `Total de Peso: ${totalWeight}`;
        $calculatedTimesList.innerHTML = '';

        if (totalWeight === 0 || totalMinutes === 0) {
            $calculatedTimesList.innerHTML = '<p class="placeholder-text">Defina horas e mova itens para calcular.</p>';
            todayActivities.forEach(act => act.targetTime = 0);
            return;
        }

        todayActivities.forEach(activity => {
            const rawTime = (activity.weight / totalWeight) * totalMinutes;
            activity.targetTime = roundToNearestTenMinutes(rawTime);
            
            const p = document.createElement('p');
            p.textContent = `${activity.name} (Peso ${activity.weight}): ${activity.targetTime} minutos`;
            $calculatedTimesList.appendChild(p);
        });

        salvarEstado();
        renderExecutionScreen();
    }

    function renderExecutionScreen() {
        $executionTodayList.innerHTML = '';
        if (todayActivities.length === 0) {
            $executionTodayList.innerHTML = '<p class="placeholder-text">Nenhuma atividade para hoje.</p>';
            return;
        }

        todayActivities.forEach(act => {
            const item = document.createElement('div');
            item.className = 'execution-today-item';
            item.dataset.id = act.id;
            if (act.id === currentStudyActivityId) {
                item.classList.add('selected');
            }

            const timeSpentFormatted = formatTime(act.timeSpent || 0);
            item.innerHTML = `
                <h3>${act.name}</h3>
                <p>Meta: ${act.targetTime || 0} min | Focado: ${timeSpentFormatted}</p>
            `;
            item.addEventListener('click', () => selectActivityForStudy(act.id));
            $executionTodayList.appendChild(item);
        });

        updateSelectedActivityDetails();
    }
    
    function updateSelectedActivityDetails() {
        const activity = todayActivities.find(a => a.id === currentStudyActivityId);
        if (activity) {
            $currentActivityName.textContent = activity.name;
            $currentActivityWeight.textContent = activity.weight;
            $currentActivityTarget.textContent = `${activity.targetTime || 0} min`;
            $currentActivitySpent.textContent = formatTime(activity.timeSpent || 0);

            const progress = (activity.targetTime > 0) ? ((activity.timeSpent || 0) / (activity.targetTime * 60)) * 100 : 0;
            $progressBar.style.width = `${Math.min(progress, 100)}%`;
        } else {
            $currentActivityName.textContent = 'Nenhuma';
            $currentActivityWeight.textContent = '0';
            $currentActivityTarget.textContent = '0 min';
            $currentActivitySpent.textContent = '00:00:00';
            $progressBar.style.width = '0%';
        }
    }

    function updateUI() {
        $cronometroEstudo.textContent = formatTime(tempoEstudadoHojeSegundos);
        $tempoRedeSocial.textContent = formatTimeMinutes(tempoRedeSocialSegundos);
        $btnGastarTempo.disabled = tempoRedeSocialSegundos < 60 || cronometroEstudoInterval;
        $nextScreen2.disabled = todayActivities.length === 0;
        salvarEstado();
    }

    function addItem() {
        const name = $newItemNameInput.value.trim();
        if (!name) {
            alert("Por favor, dê um nome para a atividade.");
            return;
        }
        const newId = allActivities.length > 0 ? Math.max(...allActivities.map(a => a.id)) + 1 : 1;
        allActivities.push({ id: newId, name, weight: 5 });
        $newItemNameInput.value = '';
        atualizarTudo();
    }

    function updateActivity(id, key, value) {
        const activity = allActivities.find(a => a.id === id);
        if (activity) activity[key] = value;
        const todayActivity = todayActivities.find(a => a.id === id);
        if (todayActivity) todayActivity[key] = value;
        atualizarTudo();
    }

    function deleteActivity(id) {
        if (confirm("Tem certeza que deseja apagar esta atividade?")) {
            allActivities = allActivities.filter(a => a.id !== id);
            todayActivities = todayActivities.filter(a => a.id !== id);
            atualizarTudo();
        }
    }

    function moveActivity(id) {
        const isToday = todayActivities.some(a => a.id === id);
        if (isToday) {
            todayActivities = todayActivities.filter(a => a.id !== id);
        } else {
            const activity = allActivities.find(a => a.id === id);
            if(activity) todayActivities.push({ ...activity, timeSpent: 0 });
        }
        atualizarTudo();
    }

    function selectActivityForStudy(id) {
        if (cronometroEstudoInterval) {
            alert("Pare o cronômetro antes de trocar de atividade.");
            return;
        }
        currentStudyActivityId = id;
        $btnIniciarEstudo.disabled = false;
        renderExecutionScreen();
    }

    function iniciarEstudo() {
        if (cronometroEstudoInterval || !currentStudyActivityId) return;

        $btnIniciarEstudo.disabled = true;
        $btnPararEstudo.disabled = false;
        $btnGastarTempo.disabled = true;

        cronometroEstudoInterval = setInterval(() => {
            tempoEstudadoHojeSegundos++;
            
            const activity = todayActivities.find(a => a.id === currentStudyActivityId);
            if (activity) {
                activity.timeSpent = (activity.timeSpent || 0) + 1;
            }

            if (tempoEstudadoHojeSegundos % 60 === 0) {
                tempoRedeSocialSegundos += RECOMPENSA_MINUTO_NORMAL * 60;
            }
            
            updateUI();
            updateSelectedActivityDetails();
        }, 1000);
    }

    function pararEstudo() {
        clearInterval(cronometroEstudoInterval);
        cronometroEstudoInterval = null;
        $btnIniciarEstudo.disabled = !currentStudyActivityId;
        $btnPararEstudo.disabled = true;
        updateUI();
    }

    function gastarTempo() {
        if (tempoRedeSocialSegundos >= 60) {
            tempoRedeSocialSegundos -= 60;
            $avisoGastando.textContent = "1 minuto de pausa utilizado.";
            setTimeout(() => $avisoGastando.textContent = '', 2000);
            updateUI();
        }
    }

    function atualizarTudo() {
        salvarEstado();
        renderActivitiesLists();
        calculateAndRenderTimes();
        renderExecutionScreen();
        updateUI();
    }

    function scrollToScreen(screenNumber) {
        const targetScreen = document.getElementById(`screen-${screenNumber}`);
        if (!targetScreen) return;
        
        window.scrollTo({ top: targetScreen.offsetTop, behavior: 'smooth' });

        $fixedHeader.classList.toggle('is-visible', screenNumber > 1);
    }

    function returnToHero() {
        scrollToScreen(1);
    }

    $scrollDownButton.addEventListener('click', () => scrollToScreen(2));
    $closeButton.addEventListener('click', returnToHero);
    
    $addItemButton.addEventListener('click', addItem);
    $nextScreen2.addEventListener('click', () => scrollToScreen(3));

    $totalHoursInput.addEventListener('input', calculateAndRenderTimes);
    $backScreen3.addEventListener('click', () => scrollToScreen(2));
    $nextScreen3.addEventListener('click', () => scrollToScreen(4));

    $btnIniciarEstudo.addEventListener('click', iniciarEstudo);
    $btnPararEstudo.addEventListener('click', pararEstudo);
    $btnGastarTempo.addEventListener('click', gastarTempo);
    $backScreen4.addEventListener('click', () => {
        pararEstudo();
        scrollToScreen(3);
    });

    carregarEstado();
});