const jwt = require('jsonwebtoken');

// Secret para JWT (em produção, usar variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-dev-2024';

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ erro: 'Token não fornecido' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded; // Adiciona dados do usuário na requisição
        next();
    } catch (err) {
        return res.status(401).json({ erro: 'Token inválido ou expirado' });
    }
};

/**
 * Middleware de autorização por nível de acesso
 * @param {number} nivelMinimo 
 */
const authorize = (nivelMinimo) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({ erro: 'Usuário não autenticado' });
        }

        if (req.usuario.nivel_acesso > nivelMinimo) {
            return res.status(403).json({ 
                erro: 'Acesso negado. Você não tem permissão para esta operação.' 
            });
        }

        next();
    };
};

/**
 * Middleware de autorização por tipo de usuário
 * @param {Array<string>} tiposPermitidos - Tipos permitidos (admin, organizador, aluno)
 */

const authorizeByType = (tiposPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({ erro: 'Usuário não autenticado' });
        }

        if (!tiposPermitidos.includes(req.usuario.tipo)) {
            return res.status(403).json({ 
                erro: `Acesso restrito. Apenas ${tiposPermitidos.join(', ')} podem acessar.` 
            });
        }

        next();
    };
};

const authorizeOwnerOrAdmin = (getUserIdFromRequest) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({ erro: 'Usuário não autenticado' });
        }

        const userId = getUserIdFromRequest(req);
        
        // Admin pode acessar qualquer recurso
        if (req.usuario.tipo === 'admin') {
            return next();
        }

        // Verifica se é o dono do recurso
        if (req.usuario.id !== userId) {
            return res.status(403).json({ 
                erro: 'Você não tem permissão para acessar este recurso.' 
            });
        }

        next();
    };
};

module.exports = {
    authenticate,
    authorize,
    authorizeByType,
    authorizeOwnerOrAdmin,
    JWT_SECRET
};
