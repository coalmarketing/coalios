if (window.netlifyIdentity) {
    window
      .netlifyIdentity
      .on('init', (user) => {
        if (!user) {
          window
            .netlifyIdentity
            .on('login', () => {
                document.location.href = '/admin/';
            });
        }
    });

    window
      .netlifyIdentity
      .on('logout', () => {
          document.location.href = '/admin/';
      });
    
    window.netlifyIdentity.setLocale('cs');
}