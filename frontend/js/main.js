// frontend/js/main.js

$(document).ready(function() {
    // Highlight active navigation link
    $('nav a').on('click', function() {
        $('nav a').removeClass('active');
        $(this).addClass('active');
    });

    // Handle logout
    $('#logoutBtn').on('click', function(e) {
        e.preventDefault();
        $.ajax({
            url: '/auth/logout',
            method: 'POST',
            success: function(response) {
                alert(response.message);
                window.location.href = 'index.html';
            },
            error: function(err) {
                alert('Error logging out.');
            }
        });
    });
});
