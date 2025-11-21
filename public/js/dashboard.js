// Check authentication
if (!getToken()) {
    window.location.href = 'index.html';
}

const currentUser = getUser();

console.log('👤 Usuário logado:', currentUser);
console.log('📋 Tipo:', currentUser.tipo);
console.log('🆔 ID:', currentUser.id);


document.getElementById('userName').textContent = currentUser.nome;


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


document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        

        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        const section = link.dataset.section;
  
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
        
   
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        
  
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
    
            loadSectionData(section);
        } else {
            console.error('❌ Seção não encontrada:', sectionId);
        }
    });
});


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
                        <button class="btn btn-info btn-small" onclick="verMateriaisEvento('${inscricao.evento_id}')">
                            <i class="fas fa-book"></i> Materiais
                        </button>
                        ${inscricao.status === 'confirmado' ? 
                            `<button class="btn btn-success btn-small" onclick="abrirModalDarFeedback('${inscricao.evento_id}')">
                                <i class="fas fa-star"></i> Avaliar
                            </button>
                            <button class="btn btn-danger btn-small" onclick="cancelarInscricao('${inscricao.id}')">
                                <i class="fas fa-times"></i> Cancelar
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
                    <button class="btn btn-info btn-small" onclick="gerenciarMateriais('${evento.id}')" title="Gerenciar materiais">
                        <i class="fas fa-book"></i> Materiais
                    </button>
                    <button class="btn btn-success btn-small" onclick="gerenciarFeedbacks('${evento.id}')" title="Ver feedbacks">
                        <i class="fas fa-comments"></i> Feedbacks
                    </button>
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

// Load categories and populate selects
async function loadCategorias() {
    try {
        const data = await CategoriasAPI.getAll();

        const categoriaSelect = document.getElementById('eventoCategoria');
        const filterSelect = document.getElementById('filterCategoria');

        if (!categoriaSelect || !filterSelect) return;

        // Build options
        const options = ['<option value="">Selecione uma categoria</option>'];
        const filterOptions = ['<option value="">Todas as categorias</option>'];

        data.categorias.forEach(cat => {
            options.push(`<option value="${cat.id}">${cat.nome}</option>`);
            filterOptions.push(`<option value="${cat.id}">${cat.nome}</option>`);
        });

        categoriaSelect.innerHTML = options.join('');
        filterSelect.innerHTML = filterOptions.join('');
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        throw error;
    }
}

// Abrir modal de criar categoria
function abrirModalCategoria() {
    document.getElementById('modalCategoria').classList.add('active');
    document.getElementById('formCategoria').reset();
}

// Form de criar categoria
document.getElementById('formCategoria')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('categoriaNome').value;
    const descricao = document.getElementById('categoriaDescricao').value;
    
    try {
        await CategoriasAPI.create({ nome, descricao });
        showAlert('Categoria criada com sucesso!', 'success');
        
        document.getElementById('modalCategoria').classList.remove('active');
        
        // Recarrega categorias e seleciona a recém criada
        await loadCategorias();
        
        // Tenta selecionar a categoria recém criada pelo nome
        const categoriaSelect = document.getElementById('eventoCategoria');
        const options = Array.from(categoriaSelect.options);
        const newOption = options.find(opt => opt.text === nome);
        if (newOption) {
            categoriaSelect.value = newOption.value;
        }
    } catch (error) {
        showAlert(error.message, 'error');
    }
});

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
    // Garantir que categorias estejam carregadas antes de abrir o modal
    loadCategorias().then(() => {
        document.getElementById('modalEvento').classList.add('active');
        document.getElementById('modalEventoTitle').innerHTML = '<i class="fas fa-calendar-plus"></i> Criar Novo Evento';
        document.getElementById('formEvento').reset();
        document.getElementById('eventoId').value = '';
    }).catch(err => {
        showAlert('Erro ao carregar categorias: ' + err.message, 'error');
        document.getElementById('modalEvento').classList.add('active');
    });
});


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
        await loadCategorias();
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


document.querySelectorAll('.modal-close, [data-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
        const modalId = btn.dataset.modal;
        if (modalId) {
            document.getElementById(modalId).classList.remove('active');
        }
    });
});

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});


// Event filters
document.getElementById('searchEvento')?.addEventListener('input', () => applyEventosFilters());
document.getElementById('filterCategoria')?.addEventListener('change', () => applyEventosFilters());
document.getElementById('filterStatus')?.addEventListener('change', () => applyEventosFilters());
document.getElementById('sortEventos')?.addEventListener('change', () => applyEventosFilters());

document.getElementById('btnLimparFiltros')?.addEventListener('click', () => {
    document.getElementById('searchEvento').value = '';
    document.getElementById('filterCategoria').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('sortEventos').value = 'data-asc';
    applyEventosFilters();
});

// View toggle
document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const view = btn.dataset.view;
        const grid = document.getElementById('eventosGrid');
        
        if (view === 'list') {
            grid.classList.remove('cards-grid');
            grid.classList.add('cards-list');
        } else {
            grid.classList.remove('cards-list');
            grid.classList.add('cards-grid');
        }
    });
});

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
loadCategorias().then(() => {
    loadEventos();
}).catch(() => {
    // Se falhar em carregar categorias, ainda tentamos carregar eventos
    loadEventos();
});

// ============================================
// GERENCIAMENTO DE MATERIAIS
// ============================================

let eventoSelecionadoMateriais = null;

async function gerenciarMateriais(eventoId) {
    // Extrair apenas o número do ID (ex: "EVT-20251120-00001" -> 1)
    const eventoIdNumerico = typeof eventoId === 'string' && eventoId.includes('-') 
        ? parseInt(eventoId.split('-').pop()) 
        : parseInt(eventoId);
    
    eventoSelecionadoMateriais = eventoIdNumerico;
    
    try {
        // Buscar informações do evento
        const evento = await EventosAPI.getById(eventoId);
        document.getElementById('modalMateriaisTitle').innerHTML = 
            `<i class="fas fa-book"></i> Materiais: ${evento.titulo}`;
        
        // Carregar lista de materiais
        await carregarMateriais(eventoIdNumerico);
        
        // Abrir modal
        document.getElementById('modalMateriais').classList.add('active');
    } catch (error) {
        showAlert('Erro ao carregar materiais: ' + error.message, 'error');
    }
}

async function carregarMateriais(eventoId) {
    const container = document.getElementById('listaMateriais');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando materiais...</div>';
    
    try {
        const response = await MaterialAPI.getByEvento(eventoId);
        const materiais = response.data || [];
        
        if (materiais.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"><i class="fas fa-book-open"></i></div>
                    <h4>Nenhum material disponível</h4>
                    <p>Adicione materiais para este evento usando o botão acima.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = materiais.map(material => {
            const tipoIcon = {
                'PDF': 'fa-file-pdf',
                'Video': 'fa-video',
                'Link': 'fa-link',
                'Apresentacao': 'fa-presentation',
                'Codigo': 'fa-code',
                'Outro': 'fa-file'
            }[material.tipo] || 'fa-file';
            
            return `
                <div class="material-card">
                    <div class="material-header">
                        <div class="material-icon"><i class="fas ${tipoIcon}"></i></div>
                        <div class="material-info">
                            <h4>${material.titulo}</h4>
                            <span class="material-tipo">${material.tipo}</span>
                        </div>
                        <div class="material-actions">
                            <span class="material-downloads"><i class="fas fa-download"></i> ${material.downloads}</span>
                            <button class="btn btn-danger btn-small" onclick="deletarMaterial('${material._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    ${material.links && material.links.length > 0 ? `
                        <div class="material-links">
                            ${material.links.map(link => `
                                <a href="${link}" target="_blank" class="material-link">
                                    <i class="fas fa-external-link-alt"></i> ${link}
                                </a>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    } catch (error) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-exclamation-triangle"></i></div>
                <h4>Erro ao carregar materiais</h4>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function abrirModalAdicionarMaterial() {
    document.getElementById('materialEventoId').value = eventoSelecionadoMateriais;
    document.getElementById('formAdicionarMaterial').reset();
    document.getElementById('materialArquivo').value = ''; // Limpar base64
    document.getElementById('modalAdicionarMaterial').classList.add('active');
}

// Converter arquivo para base64
document.getElementById('materialArquivoUpload')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showAlert('Arquivo muito grande! Máximo 5MB.', 'error');
        e.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        document.getElementById('materialArquivo').value = event.target.result;
        showAlert('Arquivo carregado com sucesso!', 'success');
    };
    reader.onerror = function() {
        showAlert('Erro ao ler arquivo!', 'error');
    };
    reader.readAsDataURL(file);
});

document.getElementById('formAdicionarMaterial').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const eventoId = document.getElementById('materialEventoId').value;
    const tipo = document.getElementById('materialTipo').value;
    const titulo = document.getElementById('materialTitulo').value;
    const linksText = document.getElementById('materialLinks').value;
    const arquivo = document.getElementById('materialArquivo').value;
    
    const links = linksText ? linksText.split(',').map(l => l.trim()).filter(l => l) : [];
    
    try {
        await MaterialAPI.create({
            evento_id: parseInt(eventoId),
            tipo,
            titulo,
            arquivo: arquivo || '',
            links
        });
        
        showAlert('Material adicionado com sucesso!', 'success');
        document.getElementById('modalAdicionarMaterial').classList.remove('active');
        await carregarMateriais(eventoId);
    } catch (error) {
        showAlert('Erro ao adicionar material: ' + error.message, 'error');
    }
});

async function deletarMaterial(materialId) {
    if (!confirm('Deseja realmente excluir este material?')) return;
    
    try {
        await MaterialAPI.delete(materialId);
        showAlert('Material excluído com sucesso!', 'success');
        await carregarMateriais(eventoSelecionadoMateriais);
    } catch (error) {
        showAlert('Erro ao excluir material: ' + error.message, 'error');
    }
}

// ============================================
// GERENCIAMENTO DE FEEDBACKS
// ============================================

let eventoSelecionadoFeedbacks = null;

async function gerenciarFeedbacks(eventoId) {
    // Extrair apenas o número do ID (ex: "EVT-20251120-00001" -> 1)
    const eventoIdNumerico = typeof eventoId === 'string' && eventoId.includes('-') 
        ? parseInt(eventoId.split('-').pop()) 
        : parseInt(eventoId);
    
    eventoSelecionadoFeedbacks = eventoIdNumerico;
    
    try {
        // Buscar informações do evento
        const evento = await EventosAPI.getById(eventoId);
        document.getElementById('modalFeedbacksTitle').innerHTML = 
            `<i class="fas fa-comments"></i> Feedbacks: ${evento.titulo}`;
        
        // Carregar feedbacks
        await carregarFeedbacks(eventoIdNumerico);
        
        // Abrir modal
        document.getElementById('modalFeedbacks').classList.add('active');
    } catch (error) {
        showAlert('Erro ao carregar feedbacks: ' + error.message, 'error');
    }
}

async function carregarFeedbacks(eventoId) {
    const statsContainer = document.getElementById('feedbackStats');
    const listContainer = document.getElementById('listaFeedbacks');
    
    statsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando estatísticas...</div>';
    listContainer.innerHTML = '';
    
    try {
        // Carregar média
        let mediaData = null;
        try {
            mediaData = await FeedbacksAPI.getMedia(eventoId);
        } catch (err) {
            // Se não houver feedbacks, não há média
        }
        
        // Carregar feedbacks
        const response = await FeedbacksAPI.getByEvento(eventoId);
        const feedbacks = response.feedbacks || [];
        
        // Exibir estatísticas
        if (mediaData) {
            const stars = '★'.repeat(Math.round(mediaData.media)) + '☆'.repeat(5 - Math.round(mediaData.media));
            statsContainer.innerHTML = `
                <div class="feedback-stats-card">
                    <div class="feedback-stat">
                        <i class="fas fa-star"></i>
                        <div>
                            <strong>${mediaData.media.toFixed(1)}</strong>
                            <span>Média de Avaliação</span>
                        </div>
                    </div>
                    <div class="feedback-stat">
                        <i class="fas fa-comments"></i>
                        <div>
                            <strong>${mediaData.total}</strong>
                            <span>Total de Feedbacks</span>
                        </div>
                    </div>
                    <div class="feedback-rating">
                        <span class="stars">${stars}</span>
                    </div>
                </div>
            `;
        } else {
            statsContainer.innerHTML = `
                <div class="feedback-stats-card">
                    <div class="feedback-stat">
                        <i class="fas fa-info-circle"></i>
                        <div>
                            <strong>Sem avaliações</strong>
                            <span>Nenhum feedback recebido ainda</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Exibir lista de feedbacks
        if (feedbacks.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"><i class="fas fa-comments"></i></div>
                    <h4>Nenhum feedback disponível</h4>
                    <p>Os participantes ainda não deixaram feedbacks para este evento.</p>
                </div>
            `;
            return;
        }
        
        listContainer.innerHTML = feedbacks.map(feedback => {
            const stars = '★'.repeat(feedback.nota) + '☆'.repeat(5 - feedback.nota);
            return `
                <div class="feedback-card">
                    <div class="feedback-header">
                        <div class="feedback-user">
                            <div class="feedback-avatar"><i class="fas fa-user"></i></div>
                            <div class="feedback-user-info">
                                <strong>Usuário #${feedback.usuario_id}</strong>
                                <span>${new Date(feedback.data).toLocaleDateString('pt-BR')}</span>
                            </div>
                        </div>
                        <div class="feedback-rating">
                            <span class="stars">${stars}</span>
                            <span class="rating-number">${feedback.nota}/5</span>
                        </div>
                    </div>
                    ${feedback.comentario ? `
                        <div class="feedback-comment">
                            <p>${feedback.comentario}</p>
                        </div>
                    ` : ''}
                    ${feedback.tags && feedback.tags.length > 0 ? `
                        <div class="feedback-tags">
                            ${feedback.tags.map(tag => `<span class="feedback-tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="feedback-actions">
                        <button class="btn btn-danger btn-small" onclick="deletarFeedback('${feedback._id}')">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        statsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-exclamation-triangle"></i></div>
                <h4>Erro ao carregar feedbacks</h4>
                <p>${error.message}</p>
            </div>
        `;
    }
}

async function deletarFeedback(feedbackId) {
    if (!confirm('Deseja realmente excluir este feedback?')) return;
    
    try {
        await FeedbacksAPI.delete(feedbackId);
        showAlert('Feedback excluído com sucesso!', 'success');
        await carregarFeedbacks(eventoSelecionadoFeedbacks);
    } catch (error) {
        showAlert('Erro ao excluir feedback: ' + error.message, 'error');
    }
}

// ============================================
// DAR FEEDBACK (PARTICIPANTE)
// ============================================

async function abrirModalDarFeedback(eventoId) {
    // Extrair apenas o número do ID (ex: "EVT-20251120-00001" -> 1)
    const eventoIdNumerico = typeof eventoId === 'string' && eventoId.includes('-') 
        ? parseInt(eventoId.split('-').pop()) 
        : parseInt(eventoId);
    
    document.getElementById('feedbackEventoId').value = eventoIdNumerico;
    document.getElementById('formDarFeedback').reset();
    document.getElementById('modalDarFeedback').classList.add('active');
}

document.getElementById('formDarFeedback').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const eventoIdValue = document.getElementById('feedbackEventoId').value;
    const notaElement = document.querySelector('input[name="nota"]:checked');
    
    if (!eventoIdValue) {
        showAlert('Erro: ID do evento não encontrado.', 'error');
        return;
    }
    
    if (!notaElement) {
        showAlert('Por favor, selecione uma avaliação de 1 a 5 estrelas.', 'error');
        return;
    }
    
    if (!currentUser || !currentUser.id) {
        showAlert('Erro: Usuário não identificado. Faça login novamente.', 'error');
        return;
    }
    
    const eventoId = parseInt(eventoIdValue);
    const nota = parseInt(notaElement.value);
    const comentario = document.getElementById('feedbackComentario').value.trim();
    const tagsText = document.getElementById('feedbackTags').value.trim();
    
    const tags = tagsText ? tagsText.split(',').map(t => t.trim()).filter(t => t) : [];
    
    const feedbackData = {
        evento_id: eventoId,
        usuario_id: currentUser.id,
        nota,
        comentario: comentario || null,
        tags
    };
    
    console.log('Enviando feedback:', feedbackData);
    
    try {
        const response = await FeedbacksAPI.create(feedbackData);
        
        showAlert('Feedback enviado com sucesso! Obrigado pela avaliação.', 'success');
        document.getElementById('modalDarFeedback').classList.remove('active');
    } catch (error) {
        console.error('Erro ao enviar feedback:', error);
        showAlert('Erro ao enviar feedback: ' + error.message, 'error');
    }
});

// ============================================
// VER MATERIAIS (PARTICIPANTE)
// ============================================

async function verMateriaisEvento(eventoId) {
    // Extrair apenas o número do ID (ex: "EVT-20251120-00001" -> 1)
    const eventoIdNumerico = typeof eventoId === 'string' && eventoId.includes('-') 
        ? parseInt(eventoId.split('-').pop()) 
        : parseInt(eventoId);
    
    try {
        // Buscar informações do evento
        const evento = await EventosAPI.getById(eventoId);
        document.getElementById('modalVerMateriaisTitle').innerHTML = 
            `<i class="fas fa-book"></i> Materiais: ${evento.titulo}`;
        
        // Carregar materiais
        await carregarMateriaisVer(eventoIdNumerico);
        
        // Abrir modal
        document.getElementById('modalVerMateriais').classList.add('active');
    } catch (error) {
        showAlert('Erro ao carregar materiais: ' + error.message, 'error');
    }
}

async function carregarMateriaisVer(eventoId) {
    const container = document.getElementById('listaMateriaisVer');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando materiais...</div>';
    
    try {
        const response = await MaterialAPI.getByEvento(eventoId);
        const materiais = response.data || [];
        
        if (materiais.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"><i class="fas fa-book-open"></i></div>
                    <h4>Nenhum material disponível</h4>
                    <p>O organizador ainda não adicionou materiais para este evento.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = materiais.map(material => {
            const tipoIcon = {
                'PDF': 'fa-file-pdf',
                'Video': 'fa-video',
                'Link': 'fa-link',
                'Apresentacao': 'fa-presentation',
                'Codigo': 'fa-code',
                'Outro': 'fa-file'
            }[material.tipo] || 'fa-file';
            
            return `
                <div class="material-card">
                    <div class="material-header">
                        <div class="material-icon"><i class="fas ${tipoIcon}"></i></div>
                        <div class="material-info">
                            <h4>${material.titulo}</h4>
                            <span class="material-tipo">${material.tipo}</span>
                        </div>
                        <div class="material-actions">
                            <span class="material-downloads"><i class="fas fa-download"></i> ${material.downloads}</span>
                        </div>
                    </div>
                    ${material.links && material.links.length > 0 ? `
                        <div class="material-links">
                            ${material.links.map(link => `
                                <a href="${link}" target="_blank" class="material-link" onclick="incrementarDownload('${material._id}')">
                                    <i class="fas fa-external-link-alt"></i> ${link}
                                </a>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${material.arquivo ? `
                        <div class="material-links">
                            <button class="btn btn-primary btn-small" onclick="baixarArquivo('${material._id}', '${material.titulo}', '${material.arquivo}')">
                                <i class="fas fa-download"></i> Baixar Arquivo
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    } catch (error) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-exclamation-triangle"></i></div>
                <h4>Erro ao carregar materiais</h4>
                <p>${error.message}</p>
            </div>
        `;
    }
}

async function incrementarDownload(materialId) {
    try {
        await MaterialAPI.incrementDownload(materialId);
    } catch (error) {
        console.error('Erro ao incrementar download:', error);
    }
}

function baixarArquivo(materialId, titulo, base64) {
    try {
        // Incrementar contador
        incrementarDownload(materialId);
        
        // Criar link para download
        const link = document.createElement('a');
        link.href = base64;
        link.download = titulo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert('Download iniciado!', 'success');
    } catch (error) {
        showAlert('Erro ao baixar arquivo: ' + error.message, 'error');
    }
}
