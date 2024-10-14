// frontend/js/auth.js

$(document).ready(function() {
    // Signup Form Submission
    $('#signupForm').on('submit', function(e) {
        e.preventDefault();
        const email = $('#signupEmail').val();
        const password = $('#signupPassword').val();

        $.ajax({
            url: '/auth/signup',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email, password }),
            success: function(response) {
                $('#signupMessage').html(`<p class="success">${response.message}</p>`);
                // Redirect to dashboard after successful signup
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            },
            error: function(err) {
                const errors = err.responseJSON && err.responseJSON.errors
                    ? err.responseJSON.errors
                    : [{ msg: err.responseJSON.message || 'An error occurred during signup.' }];
                let errorHtml = '<ul>';
                errors.forEach(error => {
                    errorHtml += `<li class="error">${error.msg}</li>`;
                });
                errorHtml += '</ul>';
                $('#signupMessage').html(errorHtml);
            }
        });
    });

    // Login Form Submission
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        const email = $('#loginEmail').val();
        const password = $('#loginPassword').val();

        $.ajax({
            url: '/auth/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email, password }),
            success: function(response) {
                $('#loginMessage').html(`<p class="success">${response.message}</p>`);
                // Redirect to dashboard after successful login
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            },
            error: function(err) {
                const errors = err.responseJSON && err.responseJSON.errors
                    ? err.responseJSON.errors
                    : [{ msg: err.responseJSON.message || 'An error occurred during login.' }];
                let errorHtml = '<ul>';
                errors.forEach(error => {
                    errorHtml += `<li class="error">${error.msg}</li>`;
                });
                errorHtml += '</ul>';
                $('#loginMessage').html(errorHtml);
            }
        });
    });
});
