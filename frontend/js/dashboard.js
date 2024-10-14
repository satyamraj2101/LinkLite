$(document).ready(function() {
    // Fetch and display user's links on page load
    fetchUserLinks();

    // Handle Create Link Form Submission
    $('#createLinkForm').on('submit', function(e) {
        e.preventDefault();
        const longUrlDesktop = $('#longUrlDesktop').val();
        const longUrlMobile = $('#longUrlMobile').val();
        const shortCode = $('#shortCode').val();
        const name = $('#linkName').val();
        const expiry = $('#expiry').val();
        const imageUrl = $('#imageUrl').val();

        $.ajax({
            url: '/links/create',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ 
                longUrlDesktop, 
                longUrlMobile, 
                shortCode, 
                name, 
                expiry, 
                imageUrl 
            }),
            success: function(response) {
                $('#createLinkMessage').html(`<p class="success">${response.message}</p>`);
                // Clear the form
                $('#createLinkForm')[0].reset();
                // Refresh the links table
                fetchUserLinks();
            },
            error: function(err) {
                const errors = err.responseJSON && err.responseJSON.errors
                    ? err.responseJSON.errors
                    : [{ msg: err.responseJSON.message || 'An error occurred.' }];
                let errorHtml = '<ul>';
                errors.forEach(error => {
                    errorHtml += `<li class="error">${error.msg}</li>`;
                });
                errorHtml += '</ul>';
                $('#createLinkMessage').html(errorHtml);
            }
        });
    });

    // Function to fetch and display user's links
    function fetchUserLinks() {
        $.ajax({
            url: '/links/my-links',
            method: 'GET',
            success: function(response) {
                const links = response.links;
                let rows = '';
                links.forEach(link => {
                    rows += `
                        <tr>
                            <td><a href="${window.location.origin}/${link.shortCode}" target="_blank">${window.location.origin}/${link.shortCode}</a></td>
                            <td><a href="${link.longUrlDesktop}" target="_blank">${link.longUrlDesktop}</a></td>
                            <td>${link.clicks}</td>
                            <td>${new Date(link.createdAt).toLocaleString()}</td>
                            <td>${link.expiry ? new Date(link.expiry).toLocaleDateString() : 'N/A'}</td>
                            <td>
                                <a href="analytics.html?linkId=${link.id}" class="btn btn-sm btn-info"><i class="fas fa-chart-pie"></i> View Analytics</a>
                            </td>
                        </tr>
                    `;
                });
                $('#linksTable tbody').html(rows);
                $('#linksMessage').html('');
            },
            error: function(err) {
                const errors = err.responseJSON && err.responseJSON.errors
                    ? err.responseJSON.errors
                    : [{ msg: err.responseJSON.message || 'Failed to fetch links.' }];
                let errorHtml = '<ul>';
                errors.forEach(error => {
                    errorHtml += `<li class="error">${error.msg}</li>`;
                });
                errorHtml += '</ul>';
                $('#linksMessage').html(errorHtml);
            }
        });
    }
});

