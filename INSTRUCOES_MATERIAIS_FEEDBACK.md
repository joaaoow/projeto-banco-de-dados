# Sistema de Materiais e Feedbacks - MongoDB

## 📋 O que foi implementado

### 1. **Sistema de Materiais** (MongoDB)
- Organizadores podem adicionar materiais aos seus eventos
- Upload de arquivos (PDF, imagens, documentos) até 5MB
- Conversão automática para Base64
- Suporte a links externos
- Contador de downloads
- Tipos: PDF, Vídeo, Link, Apresentação, Código, Outro

### 2. **Sistema de Feedbacks** (MongoDB)
- Qualquer usuário inscrito pode avaliar eventos
- Avaliação por estrelas (1-5)
- Comentários opcionais
- Tags personalizadas
- Estatísticas automáticas (média e total)
- Organizadores podem visualizar e gerenciar feedbacks

## 🚀 Como usar

### **Para Organizadores:**

1. **Adicionar Materiais:**
   - Acesse "Meus Eventos Organizados"
   - Clique em "Materiais" no evento desejado
   - Clique em "Adicionar Material"
   - Escolha o tipo, título e faça upload do arquivo
   - Ou adicione links externos
   - Clique em "Salvar Material"

2. **Ver Feedbacks:**
   - Clique em "Feedbacks" no seu evento
   - Veja a média de avaliação e estatísticas
   - Leia comentários dos participantes
   - Opção de excluir feedbacks inadequados

### **Para Participantes:**

1. **Ver Materiais:**
   - Acesse "Minhas Inscrições"
   - Clique em "Materiais" no evento
   - Baixe arquivos ou acesse links
   - Downloads são contabilizados automaticamente

2. **Dar Feedback:**
   - Acesse "Minhas Inscrições"
   - Clique em "Avaliar" em eventos confirmados
   - Escolha de 1 a 5 estrelas
   - Adicione comentário (opcional)
   - Adicione tags (opcional)
   - Envie a avaliação

## ⚙️ Configuração do MongoDB

### **Passo 1: Iniciar MongoDB**

```powershell
# Se o MongoDB estiver instalado como serviço:
net start MongoDB

# Ou inicie manualmente:
mongod --dbpath "C:\data\db"
```

### **Passo 2: Verificar Conexão**

```powershell
# Testar conexão
mongosh
# Dentro do mongosh:
use eventos_db
show collections
```

### **Passo 3: Iniciar o Servidor**

```powershell
cd projeto-banco-de-dados\projeto-banco-de-dados
node server.js
```

## 📊 Estrutura MongoDB

### **Coleção: materials**
```javascript
{
  _id: ObjectId,
  evento_id: Number,        // ID do evento (MySQL)
  tipo: String,             // PDF, Video, Link, etc
  titulo: String,           // Nome do material
  arquivo: String,          // Base64 do arquivo
  links: [String],          // Array de URLs
  downloads: Number         // Contador de downloads
}
```

### **Coleção: feedbacks**
```javascript
{
  _id: ObjectId,
  evento_id: Number,        // ID do evento (MySQL)
  usuario_id: Number,       // ID do usuário (MySQL)
  nota: Number,             // 1-5 estrelas
  comentario: String,       // Comentário opcional
  tags: [String],           // Tags personalizadas
  data: Date                // Data do feedback
}
```

## 🔌 Endpoints da API

### **Materiais:**
- `POST /material` - Criar material
- `GET /material` - Listar todos
- `GET /material/evento/:id` - Por evento
- `PUT /material/:id/download` - Incrementar download
- `DELETE /material/:id` - Deletar material

### **Feedbacks:**
- `POST /feedbacks` - Criar feedback
- `GET /feedbacks` - Listar todos
- `GET /feedbacks/evento/:id` - Por evento
- `GET /feedbacks/evento/:id/media` - Média do evento
- `PUT /feedbacks/:id` - Atualizar feedback
- `DELETE /feedbacks/:id` - Deletar feedback

## 🧪 Testar Funcionalidades

### **1. Testar Upload de Material:**
```javascript
// No console do navegador (após login como organizador):
const formData = {
    evento_id: 1,
    tipo: 'PDF',
    titulo: 'Material de Teste',
    links: ['https://exemplo.com/arquivo.pdf'],
    arquivo: ''
};

await MaterialAPI.create(formData);
```

### **2. Testar Feedback:**
```javascript
// No console do navegador (após login como participante):
const feedback = {
    evento_id: 1,
    usuario_id: 1,
    nota: 5,
    comentario: 'Evento excelente!',
    tags: ['organizado', 'informativo']
};

await FeedbacksAPI.create(feedback);
```

## 📁 Arquivos Modificados

1. **Frontend:**
   - `public/dashboard.html` - Novos modais
   - `public/js/dashboard.js` - Funções de materiais e feedback
   - `public/js/api.js` - APIs do MongoDB
   - `public/css/style.css` - Estilos de rating e materiais

2. **Backend:**
   - `routes/material.js` - Rota DELETE adicionada
   - `routes/feedbacks.js` - Rotas completas
   - `models/mongo/materialModel.js` - Schema Mongoose
   - `models/mongo/feedbackModel.js` - Schema Mongoose

## 🎯 Funcionalidades Principais

✅ Upload de arquivos com conversão Base64
✅ Limite de 5MB por arquivo
✅ Links externos para materiais
✅ Download tracking automático
✅ Sistema de avaliação 1-5 estrelas
✅ Comentários e tags em feedbacks
✅ Média de avaliação automática
✅ Estatísticas em tempo real
✅ Interface intuitiva com modais
✅ Validações de segurança

## 🛡️ Segurança

- Limite de tamanho de arquivo (5MB)
- Validação de tipos de arquivo
- Conversão segura para Base64
- Sanitização de inputs
- Autenticação JWT necessária

## 📱 Interface

- **Rating com estrelas** - Sistema visual de 1-5 estrelas
- **Upload de arquivos** - Interface drag-and-drop style
- **Cards de materiais** - Visual organizado com ícones
- **Estatísticas** - Cards com médias e totais
- **Responsivo** - Funciona em mobile e desktop

## 🐛 Troubleshooting

### MongoDB não conecta:
```powershell
# Verificar se MongoDB está rodando:
Get-Process mongod

# Se não estiver, inicie:
net start MongoDB
```

### Erro ao fazer upload:
- Verifique o tamanho do arquivo (máx 5MB)
- Verifique o tipo de arquivo permitido
- Veja o console do navegador para erros

### Feedbacks não aparecem:
- Verifique se o MongoDB está conectado
- Verifique se o usuário está inscrito no evento
- Veja os logs do servidor

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs do servidor
2. Abra o console do navegador (F12)
3. Verifique a conexão com MongoDB
4. Confirme que as collections existem
