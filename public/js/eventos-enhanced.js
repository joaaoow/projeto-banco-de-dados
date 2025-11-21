// Enhanced Events Functionality
let eventosData = [];
let filteredEventos = [];

async function loadEventosEnhanced() {
    const container = document.getElementById('eventosGrid');
    container.innerHTML = '<div class="loading">Carregando eventos...</div>';
    
    try {
        const data = await EventosAPI.getAll();
        eventosData = data.eventos || [];
        
        // Update statistics
        updateEventosStats(eventosData);
        
        // Apply filters and display
        applyEventosFilters();
        
    } catch (error) {
        showAlert(error.message, 'error');
        container.innerHTML = '<p class="card-text">Erro ao carregar eventos.</p>';
    }
}

function updateEventosStats(eventos) {
    const totalEventos = eventos.length;
    const eventosComVagas = eventos.filter(e => (e.vagas - e.inscritos) > 0).length;
    const totalInscritos = eventos.reduce((sum, e) => sum + (e.inscritos || 0), 0);
    const categorias = new Set(eventos.map(e => e.categoria_id).filter(c => c)).size;
    
    if (document.getElementById('statTotalEventos')) {
        document.getElementById('statTotalEventos').textContent = totalEventos;
        document.getElementById('statEventosAbertos').textContent = eventosComVagas;
        document.getElementById('statTotalInscritos').textContent = totalInscritos;
        document.getElementById('statCategorias').textContent = categorias;
    }
}

function applyEventosFilters() {
    const searchTerm = document.getElementById('searchEvento')?.value.toLowerCase() || '';
    const categoriaFilter = document.getElementById('filterCategoria')?.value || '';
    const statusFilter = document.getElementById('filterStatus')?.value || '';
    const sortOption = document.getElementById('sortEventos')?.value || 'data-asc';
    
    // Filter
    filteredEventos = eventosData.filter(evento => {
        const matchSearch = !searchTerm || 
            evento.titulo.toLowerCase().includes(searchTerm) || 
            (evento.descricao && evento.descricao.toLowerCase().includes(searchTerm));
        
        const matchCategoria = !categoriaFilter || evento.categoria_id == categoriaFilter;
        
        const vagasDisponiveis = (evento.vagas - evento.inscritos) > 0;
        const matchStatus = !statusFilter || 
            (statusFilter === 'com-vagas' && vagasDisponiveis) ||
            (statusFilter === 'lotados' && !vagasDisponiveis);
        
        return matchSearch && matchCategoria && matchStatus;
    });
    
    // Sort
    filteredEventos.sort((a, b) => {
        switch(sortOption) {
            case 'data-desc':
                return new Date(b.data_evento) - new Date(a.data_evento);
            case 'vagas-desc':
                return (b.vagas - b.inscritos) - (a.vagas - a.inscritos);
            case 'popular':
                return b.inscritos - a.inscritos;
            case 'titulo':
                return a.titulo.localeCompare(b.titulo);
            case 'data-asc':
            default:
                return new Date(a.data_evento) - new Date(b.data_evento);
        }
    });
    
    displayEventos(filteredEventos);
}

function displayEventos(eventos) {
    const container = document.getElementById('eventosGrid');
    const resultCount = document.getElementById('resultadosCount');
    
    if (resultCount) {
        resultCount.textContent = `${eventos.length} evento${eventos.length !== 1 ? 's' : ''} encontrado${eventos.length !== 1 ? 's' : ''}`;
    }
    
    if (eventos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-calendar-times"></i></div>
                <h3>Nenhum evento encontrado</h3>
                <p>Tente ajustar os filtros ou busque por outros termos.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = eventos.map(evento => {
        const vagasDisponiveis = evento.vagas - evento.inscritos;
        const percentualOcupacao = (evento.inscritos / evento.vagas * 100).toFixed(0);
        const isLotado = vagasDisponiveis <= 0;
        const dataEvento = new Date(evento.data_evento);
        const hoje = new Date();
        const diasRestantes = Math.ceil((dataEvento - hoje) / (1000 * 60 * 60 * 24));
        
        return `
            <div class="card evento-card ${isLotado ? 'lotado' : ''}">
                <div class="card-status">
                    ${isLotado ? 
                        '<span class="status-badge badge-danger"><i class="fas fa-lock"></i> Lotado</span>' : 
                        vagasDisponiveis <= 5 ? 
                            `<span class="status-badge badge-warning"><i class="fas fa-fire"></i> ${vagasDisponiveis} vagas</span>` :
                            `<span class="status-badge badge-success"><i class="fas fa-check-circle"></i> Disponível</span>`
                    }
                </div>
                <div class="card-header">
                    <h3 class="card-title">${evento.titulo}</h3>
                    ${evento.categoria_id ? `<span class="card-badge badge-info"><i class="fas fa-tag"></i> Cat. ${evento.categoria_id}</span>` : ''}
                </div>
                <div class="card-body">
                    <p class="card-text">${evento.descricao || 'Sem descrição disponível'}</p>
                    
                    <div class="card-meta">
                        <div class="meta-item">
                            <i class="fas fa-calendar-alt"></i>
                            <div>
                                <span class="meta-label">Data</span>
                                <span class="meta-value">${formatDate(evento.data_evento)}</span>
                            </div>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-user-tie"></i>
                            <div>
                                <span class="meta-label">Organizador</span>
                                <span class="meta-value">${evento.organizador || 'N/A'}</span>
                            </div>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-users"></i>
                            <div>
                                <span class="meta-label">Inscritos</span>
                                <span class="meta-value">${evento.inscritos}/${evento.vagas}</span>
                            </div>
                        </div>
                        ${diasRestantes > 0 ? `
                        <div class="meta-item">
                            <i class="fas fa-clock"></i>
                            <div>
                                <span class="meta-label">Faltam</span>
                                <span class="meta-value">${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="ocupacao-info">
                        <div class="ocupacao-header">
                            <span>Ocupação</span>
                            <span class="ocupacao-percent">${percentualOcupacao}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentualOcupacao}%"></div>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-primary btn-small" onclick="verDetalhes('${evento.id}')">
                        <i class="fas fa-info-circle"></i> Detalhes
                    </button>
                    ${!isLotado ? 
                        `<button class="btn btn-success btn-small" onclick="abrirModalInscricao('${evento.id}', '${evento.titulo.replace(/'/g, "\\'")}', '${formatDate(evento.data_evento)}', '${evento.organizador}', '${evento.inscritos}/${evento.vagas}')">
                            <i class="fas fa-check"></i> Inscrever-se
                        </button>` : 
                        `<button class="btn btn-secondary btn-small" disabled>
                            <i class="fas fa-ban"></i> Sem vagas
                        </button>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

// Override loadEventos
window.addEventListener('DOMContentLoaded', () => {
    window.loadEventos = loadEventosEnhanced;
});
