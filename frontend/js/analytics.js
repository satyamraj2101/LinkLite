// frontend/js/analytics.js

$(document).ready(function() {
    let clicksChart, geoChart, deviceChart;

    // Fetch user's links to populate the select dropdown
    fetchUserLinks();

    // Handle Fetch Analytics Button Click
    $('#fetchAnalytics').on('click', function() {
        const linkId = $('#selectLink').val();
        const startDate = $('#startDate').val();
        const endDate = $('#endDate').val();

        if (!linkId) {
            alert('Please select a link.');
            return;
        }

        fetchAnalytics(linkId, startDate, endDate);
    });

    // Function to fetch user's links
    function fetchUserLinks() {
        $.ajax({
            url: '/links/my-links',
            method: 'GET',
            success: function(response) {
                const links = response.links;
                let options = '<option value="">-- Select Link --</option>';
                links.forEach(link => {
                    options += `<option value="${link.id}">${link.name || link.shortCode}</option>`;
                });
                $('#selectLink').html(options);
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
                alert(errorHtml);
            }
        });
    }

    // Function to fetch and display analytics
    function fetchAnalytics(linkId, startDate, endDate) {
        let url = `/links/${linkId}/analytics?limit=1000`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;

        $.ajax({
            url: url,
            method: 'GET',
            success: function(response) {
                const clicks = response.clicks;
                $('#totalClicks').text(response.totalClicks);
                // Prepare data for charts
                prepareCharts(clicks);
                $('#chartsSection').show();
            },
            error: function(err) {
                const errors = err.responseJSON && err.responseJSON.errors
                    ? err.responseJSON.errors
                    : [{ msg: err.responseJSON.message || 'Failed to fetch analytics.' }];
                let errorHtml = '<ul>';
                errors.forEach(error => {
                    errorHtml += `<li class="error">${error.msg}</li>`;
                });
                errorHtml += '</ul>';
                alert(errorHtml);
            }
        });
    }

    // Function to prepare and render charts
    function prepareCharts(clicks) {
        // Clicks Over Time
        const clicksByDate = {};
        clicks.forEach(click => {
            const date = new Date(click.clicked_at).toLocaleDateString();
            clicksByDate[date] = (clicksByDate[date] || 0) + 1;
        });
        const dates = Object.keys(clicksByDate).sort((a, b) => new Date(a) - new Date(b));
        const clicksData = dates.map(date => clicksByDate[date]);

        if (clicksChart) clicksChart.destroy();
        const ctx1 = document.getElementById('clicksChart').getContext('2d');
        clicksChart = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Clicks Over Time',
                    data: clicksData,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Clicks'
                        }
                    }
                }
            }
        });

        // Geographical Distribution
        const geoCounts = {};
        clicks.forEach(click => {
            const country = click.country || 'Unknown';
            geoCounts[country] = (geoCounts[country] || 0) + 1;
        });
        const geoLabels = Object.keys(geoCounts);
        const geoData = Object.values(geoCounts);

        if (geoChart) geoChart.destroy();
        const ctx2 = document.getElementById('geoChart').getContext('2d');
        geoChart = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: geoLabels,
                datasets: [{
                    label: 'Clicks by Country',
                    data: geoData,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor:'rgba(255,99,132,1)',
                    borderWidth:1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        ticks: { autoSkip: false },
                        title: { display: true, text: 'Country' }
                    },
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Number of Clicks' }
                    }
                }
            }
        });

        // Device Types
        const deviceCounts = {};
        clicks.forEach(click => {
            const device = click.device_type || 'Unknown';
            deviceCounts[device] = (deviceCounts[device] || 0) + 1;
        });
        const deviceLabels = Object.keys(deviceCounts);
        const deviceData = Object.values(deviceCounts);

        if (deviceChart) deviceChart.destroy();
        const ctx3 = document.getElementById('deviceChart').getContext('2d');
        deviceChart = new Chart(ctx3, {
            type: 'pie',
            data: {
                labels: deviceLabels,
                datasets: [{
                    label: 'Device Types',
                    data: deviceData,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255,99,132,1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
            }
        });
    }
});
