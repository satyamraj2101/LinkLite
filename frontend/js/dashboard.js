/* js/dashboard.js */

$(document).ready(function() {
  // Fetch and display user's links on page load
  fetchUserLinks();

  // Handle Create Link Form Submission
  $('#createLinkForm').on('submit', function(e) {
    e.preventDefault();
    const longUrl = $('#longUrl').val();
    const name = $('#linkName').val();
    const expiry = $('#expiry').val();

    $.ajax({
      url: '/links/create',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ longUrl, name, expiry }),
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
                            <td><a href="${link.shortCode}" target="_blank">${window.location.origin}/${link.shortCode}</a></td>
                            <td><a href="${link.longUrl}" target="_blank">${link.longUrl}</a></td>
                            <td>${link.clicks || 0}</td>
                            <td>${new Date(link.createdAt).toLocaleString()}</td>
                            <td>${link.expiry ? new Date(link.expiry).toLocaleDateString() : 'N/A'}</td>
                            <td>
                                <a href="analytics.html?linkId=${link.id}" class="btn btn-sm btn-info">View Analytics</a>
                            </td>
                        </tr>
                    `;
        });
        $('#linksTable tbody').html(rows);
        $('#linksMessage').html('');
      },
      error: function(err) {
        const errorMsg = err.responseJSON && err.responseJSON.message
          ? err.responseJSON.message
          : 'Failed to fetch links.';
        $('#linksMessage').html(`<p class="error">${errorMsg}</p>`);
      }
    });
  }
});
