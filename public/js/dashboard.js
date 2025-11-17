// Check authentication
if (!getToken()) {
    window.location.href = 'index.html';
}

const currentUser = getUser();

console.log('👤 Usuário logado:', currentUser);
console.log('📋 Tipo:', currentUser.tipo);
console.log('🆔 ID:', currentUser.id);

// Update user info in navbar
document.getElementById('userName').textContent = currentUser.nome;

// Show/hide sections based on user type
if (currentUser.tipo === 'organizador') {
    document.querySelectorAll('.organizador-only').forEach(el => el.classList.remove('hidden'));
}

if (currentUser.grupo_id === 1) { // Admin
    document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
}

// Logout
document.getElementById('btnLogout').addEventListener('click', () => {
    removeToken();
    removeUser();
    showAlert('Logout realizado com sucesso!', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
});

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update active link
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Show corresponding section
        const section = link.dataset.section;
        
        // Map section names to element IDs
        const sectionMap = {
            'eventos': 'secEventos',
            'inscricoes': 'secInscricoes',
            'meus-eventos': 'secMeusEventos',
            'usuarios': 'secUsuarios',
            'auditoria': 'secAuditoria',
            'estatisticas': 'secEstatisticas'
        };
        
        const sectionId = sectionMap[section];
        
        console.log('🔄 Mudando para seção:', section, '-> ID:', sectionId);
        
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        
        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            // Load section data
            loadSectionData(section);
        } else {
            console.error('❌ Seção não encontrada:', sectionId);
        }
    });
});

// Load section data
async function loadSectionData(section) {
    console.log('📄 Carregando seção:', section);
    
    switch(section) {
        case 'eventos':
            await loadEventos();
            break;
        case 'inscricoes':
            await loadInscricoes();
            break;
        case 'meus-eventos':
            console.log('🎯 Iniciando loadMeusEventos...');
            await loadMeusEventos();
            break;
        case 'usuarios':
            await loadUsuarios();
            break;
        case 'auditoria':
            await loadAuditoria();
            break;
        case 'estatisticas':
            await loadEstatisticas();
            break;
    }
}

// Load eventos
async function loadEventos() {
    const container = document.getElementById('eventosGrid');
    container.innerHTML = '<div class="loading">Carregando eventos...</div>';
    
    try {
        const data = await EventosAPI.getAll();
        
        if (!data || !data.eventos || data.eventos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"><i class="fas fa-calendar-times"></i></div>
                    <h3>Nenhum evento disponível</h3>
                    <p>Não há eventos cadastrados no momento. Volte mais tarde!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = data.eventos.map(evento => `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${evento.titulo}</h3>
                    <span class="card-badge badge-info">${evento.categoria || 'Sem categoria'}</span>
                </div>
                <div class="card-body">
                    <p class="card-text">${evento.descricao || 'Sem descrição disponível'}</p>
                    <div class="card-info">
                        <span><i class="fas fa-calendar"></i> ${formatDate(evento.data_evento)}</span>
                        <span><i class="fas fa-users"></i> ${evento.inscritos}/${evento.vagas}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(evento.inscritos / evento.vagas * 100)}%"></div>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-primary btn-small" onclick="verDetalhes('${evento.id}')">
                        <i class="fas fa-eye"></i> Ver Detalhes
                    </button>
                    ${(evento.vagas_disponiveis && evento.vagas_disponiveis > 0) ? 
                        `<button class="btn btn-success btn-small" onclick="abrirModalInscricao('${evento.id}', '${evento.titulo.replace(/'/g, "\\'")}', '${formatDate(evento.data_evento)}', '${evento.organizador}', '${evento.inscritos}/${evento.vagas}')">
                            <i class="fas fa-check"></i> Inscrever-se
                        </button>` 
                        : `<span class="card-badge badge-danger">Lotado</span>`}
                </div>
            </div>
        `).join('');
    } catch (error) {
        showAlert(error.message, 'error');
        container.innerHTML = '<p class="card-text">Erro ao carregar eventos.</p>';
    }
}

// Load inscrições
async function loadInscricoes() {
    const container = document.getElementById('inscricoesGrid');
    container.innerHTML = '<div class="loading">Carregando inscrições...</div>';
    
    try {
        const data = await InscricoesAPI.getByUsuario(currentUser.id);
        
        if (!data || !data.inscricoes || data.inscricoes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"><i class="fas fa-ticket-alt"></i></div>
                    <h3>Nenhuma inscrição encontrada</h3>
                    <p>Você ainda não está inscrito em nenhum evento. Explore os eventos disponíveis!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = data.inscricoes.map(inscricao => {
            const statusClass = inscricao.status === 'confirmado' ? 'success' : 
                               inscricao.status === 'cancelado' ? 'danger' : 'warning';
            const statusIcon = inscricao.status === 'confirmado' ? '<i class="fas fa-check-circle"></i>' : 
                              inscricao.status === 'cancelado' ? '<i class="fas fa-times-circle"></i>' : '<i class="fas fa-clock"></i>';
            
            return `
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">${inscricao.titulo}</h3>
                        <span class="card-badge badge-${statusClass}">${statusIcon} ${inscricao.status}</span>
                    </div>
                    <div class="card-body">
                        <div class="detail-grid" style="margin-top: 0;">
                            <div class="detail-item">
                                <div class="detail-item-label"><i class="fas fa-calendar-check"></i> Data do Evento</div>
                                <div class="detail-item-value" style="font-size: 1rem;">${formatDate(inscricao.data_evento)}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-item-label"><i class="fas fa-clock"></i> Inscrito em</div>
                                <div class="detail-item-value" style="font-size: 1rem;">${formatDate(inscricao.data_inscricao)}</div>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        ${inscricao.status === 'confirmado' ? 
                            `<button class="btn btn-danger btn-small" onclick="cancelarInscricao('${inscricao.id}')">
                                <i class="fas fa-times"></i> Cancelar Inscrição
                            </button>` 
                            : '<span class="card-text" style="color: var(--text-secondary);">Inscrição cancelada</span>'}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        showAlert(error.message, 'error');
        container.innerHTML = '<p class="card-text">Erro ao carregar inscrições.</p>';
    }
}

// Load meus eventos (organizador)
async function loadMeusEventos() {
    const container = document.getElementById('meusEventosGrid');
    container.innerHTML = '<div class="loading">Carregando seus eventos...</div>';
    
    console.log('🔍 Buscando eventos do usuário:', currentUser.id);
    
    try {
        const data = await EventosAPI.getByOrganizador(currentUser.id);
        
        console.log('📦 Resposta da API:', data);
        
        if (!data || !data.eventos || data.eventos.length === 0) {
            console.log('⚠️ Nenhum evento encontrado');
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"><i class="fas fa-calendar-plus"></i></div>
                    <h3>Nenhum evento criado</h3>
                    <p>Você ainda não criou nenhum evento. Clique no botão "Criar Evento" para começar!</p>
                </div>
            `;
            return;
        }
        
        console.log('✅ Renderizando', data.eventos.length, 'eventos');
        
        container.innerHTML = data.eventos.map(evento => {
            const statusClass = evento.status === 'aberto' ? 'success' : 
                               evento.status === 'encerrado' ? 'warning' : 
                               evento.status === 'cancelado' ? 'danger' : 'info';
            const statusIcon = evento.status === 'aberto' ? 'fa-door-open' : 
                              evento.status === 'encerrado' ? 'fa-door-closed' : 
                              evento.status === 'cancelado' ? 'fa-ban' : 'fa-clock';
            
            return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${evento.titulo}</h3>
                    <div style="display: flex; gap: 0.5rem;">
                        <span class="card-badge badge-${statusClass}">
                            <i class="fas ${statusIcon}"></i> ${evento.status}
                        </span>
                        <span class="card-badge badge-info">
                            <i class="fas fa-users"></i> ${evento.total_inscricoes} inscritos
                        </span>
                    </div>
                </div>
                <div class="card-body">
                    <p class="card-text">${evento.descricao || 'Sem descrição disponível'}</p>
                    <div class="detail-grid" style="margin-top: 1rem;">
                        <div class="detail-item">
                            <div class="detail-item-label"><i class="fas fa-calendar"></i> Data</div>
                            <div class="detail-item-value" style="font-size: 0.95rem;">${formatDate(evento.data_evento)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-item-label"><i class="fas fa-users"></i> Ocupação</div>
                            <div class="detail-item-value" style="font-size: 0.95rem;">${evento.total_inscricoes}/${evento.vagas_totais}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-item-label"><i class="fas fa-chair"></i> Vagas Disponíveis</div>
                            <div class="detail-item-value" style="font-size: 0.95rem; color: ${evento.vagas_disponiveis > 0 ? 'var(--success)' : 'var(--danger)'};">
                                ${evento.vagas_disponiveis}
                            </div>
                        </div>
                    </div>
                    <div class="progress-bar" style="margin-top: 1rem;">
                        <div class="progress-fill" style="width: ${(evento.total_inscricoes / evento.vagas_totais * 100)}%"></div>
                    </div>
                </div>
                <div class="card-footer" style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button class="btn btn-primary btn-small" onclick="editarEvento('${evento.id}')" title="Editar evento">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-danger btn-small" onclick="deletarEvento('${evento.id}')" title="Excluir evento e suas inscrições">
                        <i class="fas fa-trash-alt"></i> Excluir
                    </button>
                </div>
            </div>
        `;
        }).join('');
    } catch (error) {
        console.error('❌ Erro ao carregar meus eventos:', error);
        showAlert(error.message, 'error');
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-exclamation-triangle"></i></div>
                <h3>Erro ao carregar eventos</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="loadMeusEventos()">
                    <i class="fas fa-sync"></i> Tentar Novamente
                </button>
            </div>
        `;
    }
}

// Load usuários (admin)
async function loadUsuarios() {
    const container = document.getElementById('usuariosTable');
    container.innerHTML = '<div class="loading">Carregando usuários...</div>';
    
    try {
        const data = await UsuariosAPI.getAll();
        
        if (!data || !data.usuarios || data.usuarios.length === 0) {
            container.innerHTML = '<p class="card-text">Nenhum usuário encontrado.</p>';
            return;
        }
        
        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Tipo</th>
                        <th>Grupo</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.usuarios.map(usuario => `
                        <tr>
                            <td>${usuario.id}</td>
                            <td>${usuario.nome}</td>
                            <td>${usuario.email}</td>
                            <td><span class="card-badge badge-info">${usuario.tipo}</span></td>
                            <td>${usuario.grupo_id}</td>
                            <td>
                                <button class="btn btn-danger btn-small" onclick="deletarUsuario('${usuario.id}')">Excluir</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        showAlert(error.message, 'error');
        container.innerHTML = '<p class="card-text">Erro ao carregar usuários.</p>';
    }
}

// Load auditoria (admin)
async function loadAuditoria() {
    const container = document.getElementById('auditoriaTable');
    container.innerHTML = '<div class="loading">Carregando logs...</div>';
    
    try {
        const data = await AuditoriaAPI.getAll({ limite: 50 });
        
        if (!data || !data.logs || data.logs.length === 0) {
            container.innerHTML = '<p class="card-text">Nenhum log encontrado.</p>';
            return;
        }
        
        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Data/Hora</th>
                        <th>Usuário</th>
                        <th>Operação</th>
                        <th>Tabela</th>
                        <th>Registro ID</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.logs.map(log => {
                        const opClass = log.operacao === 'INSERT' ? 'success' : 
                                       log.operacao === 'DELETE' ? 'danger' : 'warning';
                        return `
                            <tr>
                                <td>${formatDate(log.data_hora)}</td>
                                <td>${log.usuario}</td>
                                <td><span class="card-badge badge-${opClass}">${log.operacao}</span></td>
                                <td>${log.tabela_afetada}</td>
                                <td>${log.registro_id}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        showAlert(error.message, 'error');
        container.innerHTML = '<p class="card-text">Erro ao carregar logs.</p>';
    }
}

// Load estatísticas (admin)
async function loadEstatisticas() {
    const container = document.getElementById('estatisticasContainer');
    container.innerHTML = '<div class="loading">Carregando estatísticas...</div>';
    
    try {
        const data = await UsuariosAPI.getEstatisticas();
        
        if (!data || !data.estatisticas) {
            container.innerHTML = '<p class="card-text">Erro ao carregar estatísticas.</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${data.total}</div>
                    <div class="stat-label">Total de Usuários</div>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Usuário</th>
                        <th>Email</th>
                        <th>Tipo</th>
                        <th>Total Inscrições</th>
                        <th>Confirmadas</th>
                        <th>Canceladas</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.estatisticas.map(stat => `
                        <tr>
                            <td>${stat.nome}</td>
                            <td>${stat.email}</td>
                            <td><span class="card-badge badge-info">${stat.tipo}</span></td>
                            <td>${stat.total_inscricoes}</td>
                            <td>${stat.inscricoes_confirmadas}</td>
                            <td>${stat.inscricoes_canceladas}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        showAlert(error.message, 'error');
        container.innerHTML = '<p class="card-text">Erro ao carregar estatísticas.</p>';
    }
}

// Ver detalhes do evento
async function verDetalhes(eventoId) {
    const modal = document.getElementById('modalDetalhes');
    const conteudo = document.getElementById('detalheConteudo');
    
    modal.classList.add('active');
    conteudo.innerHTML = '<div class="loading">Carregando detalhes...</div>';
    
    try {
        const evento = await EventosAPI.getById(eventoId);
        
        document.getElementById('detalheTitulo').innerHTML = '<i class="fas fa-info-circle"></i> ' + evento.titulo;
        
        conteudo.innerHTML = `
            <div class="detail-section">
                <div class="detail-label"><i class="fas fa-align-left"></i> Descrição</div>
                <div class="detail-value">${evento.descricao || 'Sem descrição disponível'}</div>
            </div>

            <div class="detail-section">
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-item-label"><i class="fas fa-calendar-alt"></i> Data do Evento</div>
                        <div class="detail-item-value">${formatDate(evento.data_evento)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-item-label"><i class="fas fa-users"></i> Vagas</div>
                        <div class="detail-item-value">${evento.inscritos}/${evento.vagas}</div>
                    </div>
                    ${evento.taxa_ocupacao ? `
                        <div class="detail-item">
                            <div class="detail-item-label"><i class="fas fa-chart-pie"></i> Taxa de Ocupação</div>
                            <div class="detail-item-value">${evento.taxa_ocupacao}%</div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-label"><i class="fas fa-user"></i> Organizador</div>
                <div class="detail-value">
                    <strong>${evento.organizador}</strong><br>
                    <i class="fas fa-envelope"></i> ${evento.organizador_email}
                </div>
            </div>

            ${evento.inscritos < evento.vagas ? `
                <div style="margin-top: 1.5rem;">
                    <button class="btn btn-success" style="width: 100%;" onclick="abrirModalInscricao('${evento.id}', '${evento.titulo.replace(/'/g, "\\'")}', '${formatDate(evento.data_evento)}', '${evento.organizador}', '${evento.inscritos}/${evento.vagas}'); document.getElementById('modalDetalhes').classList.remove('active')">
                        <i class="fas fa-check"></i> Inscrever-se Agora
                    </button>
                </div>
            ` : `
                <div class="empty-state">
                    <div class="empty-state-icon"><i class="fas fa-exclamation-circle"></i></div>
                    <h3>Evento Lotado</h3>
                    <p>Não há mais vagas disponíveis para este evento</p>
                </div>
            `}
        `;
    } catch (error) {
        showAlert(error.message, 'error');
        conteudo.innerHTML = '<p class="card-text">Erro ao carregar detalhes.</p>';
    }
}

// Abrir modal de inscrição
let eventoParaInscrever = null;

function abrirModalInscricao(eventoId, titulo, data, organizador, vagas) {
    eventoParaInscrever = eventoId;
    
    document.getElementById('confirmEventoTitulo').textContent = titulo;
    document.getElementById('confirmEventoData').textContent = data;
    document.getElementById('confirmEventoOrg').textContent = organizador;
    document.getElementById('confirmEventoVagas').textContent = vagas;
    
    document.getElementById('modalInscricao').classList.add('active');
}

// Confirmar inscrição
document.getElementById('btnConfirmarInscricao')?.addEventListener('click', async () => {
    if (!eventoParaInscrever) return;
    
    try {
        await InscricoesAPI.create({
            usuario_id: currentUser.id,
            evento_id: eventoParaInscrever
        });
        
        document.getElementById('modalInscricao').classList.remove('active');
        showAlert('Inscrição realizada com sucesso!', 'success');
        
        await loadEventos();
        await loadInscricoes();
        
        eventoParaInscrever = null;
    } catch (error) {
        showAlert(error.message, 'error');
    }
});

// Inscrever em evento (método antigo - manter para compatibilidade)
async function inscreverEvento(eventoId, eventoTitulo) {
    if (!confirm(`Deseja se inscrever no evento "${eventoTitulo}"?`)) return;
    
    try {
        await InscricoesAPI.create({
            usuario_id: currentUser.id,
            evento_id: eventoId
        });
        
        showAlert('Inscrição realizada com sucesso!', 'success');
        await loadEventos();
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// Cancelar inscrição
async function cancelarInscricao(inscricaoId) {
    if (!confirm('Deseja realmente cancelar esta inscrição?')) return;
    
    try {
        await InscricoesAPI.cancelar(inscricaoId);
        showAlert('Inscrição cancelada com sucesso!', 'success');
        await loadInscricoes();
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// Criar novo evento (organizador)
document.getElementById('btnNovoEvento')?.addEventListener('click', () => {
    document.getElementById('modalEvento').classList.add('active');
    document.getElementById('modalEventoTitle').innerHTML = '<i class="fas fa-calendar-plus"></i> Criar Novo Evento';
    document.getElementById('formEvento').reset();
    document.getElementById('eventoId').value = '';
});

// Submit form evento
document.getElementById('formEvento').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const eventoId = document.getElementById('eventoId').value;
    const titulo = document.getElementById('eventoTitulo').value;
    const descricao = document.getElementById('eventoDescricao').value;
    const data_evento = document.getElementById('eventoData').value;
    const vagas = parseInt(document.getElementById('eventoVagas').value);
    const categoria_id = document.getElementById('eventoCategoria').value || null;
    
    try {
        if (eventoId) {
            await EventosAPI.update(eventoId, { titulo, descricao, data_evento, vagas, categoria_id });
            showAlert('Evento atualizado com sucesso!', 'success');
        } else {
            await EventosAPI.create({ 
                titulo, 
                descricao, 
                data_evento, 
                vagas, 
                categoria_id,
                organizador_id: currentUser.id 
            });
            showAlert('Evento criado com sucesso!', 'success');
        }
        
        document.getElementById('modalEvento').classList.remove('active');
        await loadMeusEventos();
    } catch (error) {
        showAlert(error.message, 'error');
    }
});

// Editar evento
async function editarEvento(eventoId) {
    try {
        const evento = await EventosAPI.getById(eventoId);
        
        document.getElementById('modalEventoTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Evento';
        document.getElementById('eventoId').value = evento.id;
        document.getElementById('eventoTitulo').value = evento.titulo;
        document.getElementById('eventoDescricao').value = evento.descricao || '';
        document.getElementById('eventoData').value = formatDateForInput(evento.data_evento);
        document.getElementById('eventoVagas').value = evento.vagas;
        document.getElementById('eventoCategoria').value = evento.categoria_id || '';
        
        document.getElementById('modalEvento').classList.add('active');
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// Deletar evento
// Deletar evento
async function deletarEvento(eventoId) {
    if (!confirm('⚠️ ATENÇÃO: Deseja realmente excluir este evento?\n\nEsta ação não pode ser desfeita e TODAS as inscrições serão removidas automaticamente.')) return;
    
    try {
        await EventosAPI.delete(eventoId);
        showAlert('Evento excluído com sucesso!', 'success');
        await loadMeusEventos();
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// Deletar usuário (admin)
async function deletarUsuario(usuarioId) {
    if (!confirm('Deseja realmente excluir este usuário?')) return;
    
    try {
        await UsuariosAPI.delete(usuarioId);
        showAlert('Usuário excluído com sucesso!', 'success');
        await loadUsuarios();
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// Close modals
document.querySelectorAll('.modal-close, [data-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
        const modalId = btn.dataset.modal;
        if (modalId) {
            document.getElementById(modalId).classList.remove('active');
        }
    });
});

// Close modal on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// Search eventos
document.getElementById('searchEvento')?.addEventListener('input', async (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('#eventosGrid .card');
    
    cards.forEach(card => {
        const title = card.querySelector('.card-title').textContent.toLowerCase();
        const desc = card.querySelector('.card-text').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || desc.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});

// Filter usuarios by tipo
document.getElementById('filterTipoUsuario')?.addEventListener('change', async (e) => {
    const tipo = e.target.value;
    
    if (tipo) {
        const data = await UsuariosAPI.getByTipo(tipo);
        // Rerender table with filtered data
        const container = document.getElementById('usuariosTable');
        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Tipo</th>
                        <th>Grupo</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.usuarios.map(usuario => `
                        <tr>
                            <td>${usuario.id}</td>
                            <td>${usuario.nome}</td>
                            <td>${usuario.email}</td>
                            <td><span class="card-badge badge-info">${usuario.tipo}</span></td>
                            <td>${usuario.grupo_id || 'N/A'}</td>
                            <td>
                                <button class="btn btn-danger btn-small" onclick="deletarUsuario('${usuario.id}')">Excluir</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else {
        await loadUsuarios();
    }
});

// Filter auditoria
document.getElementById('filterTabela')?.addEventListener('change', async () => {
    await loadAuditoriaWithFilters();
});

document.getElementById('filterOperacao')?.addEventListener('change', async () => {
    await loadAuditoriaWithFilters();
});

async function loadAuditoriaWithFilters() {
    const tabela = document.getElementById('filterTabela').value;
    const operacao = document.getElementById('filterOperacao').value;
    
    const container = document.getElementById('auditoriaTable');
    container.innerHTML = '<div class="loading">Carregando logs...</div>';
    
    try {
        let data;
        if (operacao) {
            data = await AuditoriaAPI.getByOperacao(operacao, { limite: 50 });
        } else if (tabela) {
            data = await AuditoriaAPI.getAll({ tabela, limite: 50 });
        } else {
            data = await AuditoriaAPI.getAll({ limite: 50 });
        }
        
        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Data/Hora</th>
                        <th>Usuário</th>
                        <th>Operação</th>
                        <th>Tabela</th>
                        <th>Registro ID</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.logs.map(log => {
                        const opClass = log.operacao === 'INSERT' ? 'success' : 
                                       log.operacao === 'DELETE' ? 'danger' : 'warning';
                        return `
                            <tr>
                                <td>${formatDate(log.data_hora)}</td>
                                <td>${log.usuario}</td>
                                <td><span class="card-badge badge-${opClass}">${log.operacao}</span></td>
                                <td>${log.tabela_afetada}</td>
                                <td>${log.registro_id}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        showAlert(error.message, 'error');
        container.innerHTML = '<p class="card-text">Erro ao carregar logs.</p>';
    }
}

// Load initial data
loadEventos();
