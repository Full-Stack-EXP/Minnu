document.addEventListener('DOMContentLoaded', () => {
    history.scrollRestoration = 'manual';

    const RECOMPENSA_MINUTO_NORMAL = 1;
    let tempoEstudadoHojeSegundos = 0;
    let tempoRedeSocialSegundos = 0;
    let cronometroEstudoInterval = null;
    let cronometroPausaInterval = null;
    let allActivities = [];
    let todayActivities = [];
    let currentStudyActivityId = null;

    let currentScreen = 1;

    const $scrollDownButton = document.getElementById('scroll-down-button');
    const $fixedHeader = document.getElementById('fixed-header');
    const $closeButton = document.getElementById('close-button');
    const $headerLogoButton = document.getElementById('header-logo-button');

    const $allActivitiesList = document.getElementById('all-items-list');
    const $todayStudyList = document.getElementById('today-study-list');
    const $newItemNameInput = document.getElementById('new-item-name');
    const $addItemButton = document.getElementById('add-item-button');
    const $nextScreen2 = document.getElementById('next-screen-2');

    const $totalHoursInput = document.getElementById('total-hours');
    const $totalMinutesInput = document.getElementById('total-minutes');
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
    const $avisoGastando = document.getElementById('aviso-gastando');
    const $backScreen4 = document.getElementById('back-screen-4');
    const $timerPausa = document.getElementById('timer-pausa');
    const $btnIniciarPausa = document.getElementById('iniciar-pausa');
    const $btnPausarPausa = document.getElementById('pausar-pausa');
    const $alarmSound = document.getElementById('alarm-sound');
    const $alarmModalOverlay = document.getElementById('alarm-modal-overlay');
    const $alarmOkButton = document.getElementById('alarm-ok-button');

    function carregarEstado() {
        let loadedScreen = 1;
        const dadosSalvos = localStorage.getItem('minnuData');

        if (dadosSalvos) {
            const data = JSON.parse(dadosSalvos);
            const hoje = new Date().toDateString();

            allActivities = data.allActivities || [];
            tempoRedeSocialSegundos = data.tempoRedeSocialSegundos || 0;

            loadedScreen = data.currentScreen || 1;

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
        return loadedScreen;
    }

    function salvarEstado() {
        const estado = {
            tempoEstudadoHojeSegundos,
            tempoRedeSocialSegundos,
            allActivities,
            todayActivities,
            currentScreen,
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

        const todayIds = todayActivities.map(a => a.id);

        if (allActivities.length === 0) {
            $allActivitiesList.innerHTML = '<p class="placeholder-text">Adicione ou mova atividades aqui.</p>';
        } else {
            allActivities.forEach(activity => {
                const isToday = todayIds.includes(activity.id);
                $allActivitiesList.appendChild(createActivityElement(activity, isToday));
            });
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
                
                <div class="btn-select-today ${isToday ? 'selected' : ''}" 
                     title="${isToday ? 'Remover de hoje' : 'Adicionar para hoje'}">
                </div>

                <button class="btn-delete"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;

        item.querySelector('.item-name').addEventListener('change', (e) => updateActivity(activity.id, 'name', e.target.value));
        item.querySelector('.item-weight').addEventListener('change', (e) => updateActivity(activity.id, 'weight', parseInt(e.target.value)));
        
        item.querySelector('.btn-select-today').addEventListener('click', () => moveActivity(activity.id));
        
        item.querySelector('.btn-delete').addEventListener('click', () => deleteActivity(activity.id));

        return item;
    }

    function calculateAndRenderTimes() {
        const totalHours = parseInt($totalHoursInput.value) || 0;
        const totalMinutesInput = parseInt($totalMinutesInput.value) || 0;
        const totalMinutes = (totalHours * 60) + totalMinutesInput;

        const totalWeight = todayActivities.reduce((sum, act) => sum + act.weight, 0);

        $totalWeightDisplay.textContent = `Total de Peso: ${totalWeight}`;
        $calculatedTimesList.innerHTML = '';

        if (totalWeight === 0 || totalMinutes === 0) {
            $calculatedTimesList.innerHTML = '<p class="placeholder-text">Defina o tempo e mova itens para calcular.</p>';
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
        $timerPausa.textContent = formatTime(tempoRedeSocialSegundos);

        $btnIniciarPausa.disabled = tempoRedeSocialSegundos <= 0 || cronometroEstudoInterval || cronometroPausaInterval;

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
            if (activity) todayActivities.push({ ...activity, timeSpent: 0 });
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

        pausarPausa();

        $btnIniciarEstudo.disabled = true;
        $btnPararEstudo.disabled = false;
        $btnIniciarPausa.disabled = true;

        cronometroEstudoInterval = setInterval(() => {
            tempoEstudadoHojeSegundos++;
            tempoRedeSocialSegundos++;

            const activity = todayActivities.find(a => a.id === currentStudyActivityId);
            if (activity) {
                activity.timeSpent = (activity.timeSpent || 0) + 1;
            }

            updateUI();
            updateSelectedActivityDetails();
            renderExecutionScreen();
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

    function iniciarPausa() {
        if (tempoRedeSocialSegundos <= 0 || cronometroPausaInterval) return;

        pararEstudo();

        $btnIniciarPausa.disabled = true;
        $btnPausarPausa.disabled = false;
        $btnIniciarEstudo.disabled = true;

        cronometroPausaInterval = setInterval(() => {
            tempoRedeSocialSegundos--;
            updateUI();

            if (tempoRedeSocialSegundos <= 0) {
                tempoRedeSocialSegundos = 0;
                pausarPausa();
                
                $alarmSound.play().catch(e => console.error("Erro ao tocar alarme:", e));
                
                $alarmModalOverlay.classList.add('is-visible');
            }
        }, 1000);
    }

    function pausarPausa() {
        clearInterval(cronometroPausaInterval);
        cronometroPausaInterval = null;
        $btnPausarPausa.disabled = true;

        $btnIniciarEstudo.disabled = !currentStudyActivityId;

        $alarmSound.pause();
        $alarmSound.currentTime = 0;

        $alarmModalOverlay.classList.remove('is-visible');

        updateUI();
    }

    function atualizarTudo() {
        salvarEstado();
        renderActivitiesLists();
        calculateAndRenderTimes();
        renderExecutionScreen();
        updateUI();
    }

    function navigateToScreen(screenNumber) {
        const targetScreen = document.getElementById(`screen-${screenNumber}`);
        if (!targetScreen) return;

        window.scrollTo({ top: targetScreen.offsetTop, behavior: 'smooth' });

        currentScreen = screenNumber;

        if (!isMobile) {
            $fixedHeader.classList.toggle('is-visible', currentScreen > 1);
        }

        salvarEstado();
    }

    function jumpToScreen(screenNumber) {
        const targetScreen = document.getElementById(`screen-${screenNumber}`);
        if (!targetScreen) {
            console.warn(`Tentativa de pular para tela #${screenNumber} não encontrada.`);
            window.scrollTo(0, 0);
            $fixedHeader.classList.remove('is-visible');
            return;
        }

        window.scrollTo(0, targetScreen.offsetTop);

        currentScreen = screenNumber;

        if (!isMobile) {
            $fixedHeader.classList.toggle('is-visible', currentScreen > 1);
        } else {
            $fixedHeader.classList.remove('is-visible');
        }
    }


    function returnToHero() {
        navigateToScreen(1);
    }

    function validateTimeInputs() {
        let hours = parseInt($totalHoursInput.value);
        let minutes = parseInt($totalMinutesInput.value);

        if (isNaN(hours) || hours < 0) hours = 0;
        else if (hours > 23) hours = 23;
        $totalHoursInput.value = hours;

        if (isNaN(minutes) || minutes < 0) minutes = 0;
        else if (minutes > 59) minutes = 59;
        $totalMinutesInput.value = minutes;

        calculateAndRenderTimes();
    }

    $scrollDownButton.addEventListener('click', () => navigateToScreen(2));
    $closeButton.addEventListener('click', returnToHero);
    $headerLogoButton.addEventListener('click', () => {
        pararEstudo();
        pausarPausa();
        returnToHero();
    });

    $addItemButton.addEventListener('click', addItem);
    $nextScreen2.addEventListener('click', () => navigateToScreen(3));

    $totalHoursInput.addEventListener('input', calculateAndRenderTimes);
    $totalMinutesInput.addEventListener('input', calculateAndRenderTimes);
    $backScreen3.addEventListener('click', () => navigateToScreen(2));
    $nextScreen3.addEventListener('click', () => navigateToScreen(4));

    $btnIniciarEstudo.addEventListener('click', iniciarEstudo);
    $btnPararEstudo.addEventListener('click', pararEstudo);
    $btnIniciarPausa.addEventListener('click', iniciarPausa);
    $btnPausarPausa.addEventListener('click', pausarPausa);
    $alarmOkButton.addEventListener('click', pausarPausa);
    $backScreen4.addEventListener('click', () => {
        pararEstudo();
        pausarPausa();
        navigateToScreen(3);
    });

    let isMobile = window.innerWidth <= 768;

    window.addEventListener('resize', () => {
        isMobile = window.innerWidth <= 768;
        if (!isMobile) {
            $fixedHeader.classList.toggle('is-visible', currentScreen > 1);
        }
    });

    window.addEventListener('scroll', () => {
        if (isMobile) {
            const currentScrollY = window.scrollY;

            if (currentScrollY > 100) {
                $fixedHeader.classList.add('is-visible');
            } else {
                $fixedHeader.classList.remove('is-visible');
            }
        }
    });

    const loadedScreen = carregarEstado();

    setTimeout(() => {
        jumpToScreen(loadedScreen);
    }, 0);

});