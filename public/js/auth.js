// Check if user is already logged in
if (getToken()) {
    window.location.href = 'dashboard.html';
}

// Toggle between login and register forms
document.getElementById('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.add('active');
});

document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
});

// Handle login
document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;
    
    try {
        const response = await AuthAPI.login({ email, senha });
        
        setToken(response.token);
        setUser(response.usuario);
        
        showAlert('Login realizado com sucesso!', 'success');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    } catch (error) {
        showAlert(error.message, 'error');
    }
});

// Handle register
document.getElementById('formRegister').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('registerNome').value;
    const email = document.getElementById('registerEmail').value;
    const senha = document.getElementById('registerSenha').value;
    const tipo = document.getElementById('registerTipo').value;
    const grupo_id = parseInt(document.getElementById('registerGrupo').value);
    
    try {
        const response = await AuthAPI.register({
            nome,
            email,
            senha,
            tipo,
            grupo_id
        });
        
        showAlert('Cadastro realizado com sucesso! Faça login.', 'success');
        
        // Switch to login form
        setTimeout(() => {
            document.getElementById('registerForm').classList.remove('active');
            document.getElementById('loginForm').classList.add('active');
            document.getElementById('loginEmail').value = email;
        }, 1500);
    } catch (error) {
        showAlert(error.message, 'error');
    }
});
