function updatePropertiesInfo(header, table) {
    const infoDiv = document.getElementById('properties-info');
    infoDiv.innerHTML = "";
    if (!header) {return};
    
    const propertiesContainer = document.createElement('div');
    
    // Start with the header
    let infoHtml = `<h3>${header}</h3><br>`;
    
    // Add table
    infoHtml += table;

    // Update the div's content
    propertiesContainer.innerHTML = infoHtml;
    infoDiv.appendChild(propertiesContainer);
    
    const additionalContainer = document.createElement('div');
    additionalContainer.setAttribute("id","additional-properties-container");
    infoDiv.appendChild(additionalContainer);
}

async function makeApiRequest(endpoint, parameters, sectionJson) {
  try {
    const url = new URL(endpoint, window.location.origin);
    Object.keys(parameters).forEach(key => url.searchParams.append(key, parameters[key]));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: sectionJson
    });

    if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error);
        return null;
    }
    
    return await response.json();
  
  } catch (error) {
    alert('Failed to fetch data: ' + error.message);
    return null;
  }
}

function createChart(canvas_name, data_x, data_y, x_label, y_label, data_title) {
    console.log(`DEBUGGING - createChart - ${data_title}`);
    
    // Convert to data array
    var data = data_x.map((x, i) => ({ x, y: data_y[i] }));
    
    // Check if the chart already exists
    let existingChart = Chart.getChart(canvas_name); // Get existing chart if it's there
    if (existingChart) {
        // If the chart already exists, destroy it first to avoid issues
        existingChart.destroy();
    }
    
    // Create a new chart
    const ctx = document.getElementById(canvas_name).getContext('2d');
    const myChart = new Chart(ctx, {
        type: 'line', // Define the type of chart
        data: {
            datasets: [{
                label: data_title,
                data: data,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: x_label
                    },
                    grid: {
                        lineWidth: ({ tick }) => tick.value == 0 ? 3 : 1
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: y_label
                    },
                    grid: {
                        lineWidth: ({ tick }) => tick.value == 0 ? 3 : 1
                    }
                }
            },
            pan: {
                enabled: true,
                mode: 'xy'
            },
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'xy'
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'xy'
                    }
                },
                pan: {
                    enabled: true,
                    mode: 'xy'
                },
            }
        }
    });
}