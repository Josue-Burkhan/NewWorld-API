window.onload = function() {
    setTimeout(() => {
      var topbar = document.querySelector('.topbar-wrapper');
      if (topbar) {
        var loginBtn = document.createElement('a');
        loginBtn.href = '/login';
        loginBtn.textContent = 'Login';
        loginBtn.style = 'margin-left: 15px; padding: 5px 10px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;';
        
        topbar.appendChild(loginBtn);
      }
    }, 1000);
  };
  