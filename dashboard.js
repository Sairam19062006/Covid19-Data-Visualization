document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('dataInput');
    const regionFilter = document.getElementById('regionFilter');
    let covidData = [];

    // Load saved data on startup
    const savedData = loadFromLocalStorage();
    if (savedData) {
        covidData = savedData;
        initializeDashboard(covidData);
    }

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                complete: function(results) {
                    covidData = results.data;
                    saveToLocalStorage(covidData);  // Save to localStorage
                    initializeDashboard(covidData);
                }
            });
        }
    });

    // Add these new functions
    function saveToLocalStorage(data) {
        try {
            localStorage.setItem('covidData', JSON.stringify(data));
            localStorage.setItem('lastUpdated', new Date().toISOString());
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
    }

    function loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('covidData');
            const lastUpdated = localStorage.getItem('lastUpdated');
            if (data && lastUpdated) {
                // Optional: Add last updated timestamp to the UI
                console.log('Data loaded from cache, last updated:', new Date(lastUpdated).toLocaleString());
                return JSON.parse(data);
            }
        } catch (e) {
            console.warn('Failed to load from localStorage:', e);
        }
        return null;
    }

    function initializeDashboard(data) {
        // Enable region filter
        regionFilter.disabled = false;
        
        // Get unique states
        const states = [...new Set(data.map(row => row.State))];
        
        // Populate state dropdown
        regionFilter.innerHTML = '<option value="">Select State</option>' +
            states.map(state => `<option value="${state}">${state}</option>`).join('');
        
        // Add change event listener to filter
        regionFilter.addEventListener('change', () => updateDashboard(data));
        
        // Initial dashboard update
        updateDashboard(data);
    }

    function updateDashboard(data) {
        const selectedState = regionFilter.value;
        const filteredData = selectedState ? 
            data.filter(row => row.State === selectedState) : data;

        updateStatCards(filteredData);
        updateTrendChart(filteredData);
        updateGenderDistribution(filteredData);
        updateAgeDistribution(filteredData);
    }

    function updateStatCards(data) {
        // Update statistics cards
        const latest = data[data.length - 1] || {};
        
        document.querySelector('#confirmedCases .stat-value').textContent = 
            latest.Confirmed || '0';
        document.querySelector('#activeCases .stat-value').textContent = 
            latest.Active || '0';
        document.querySelector('#recoveredCases .stat-value').textContent = 
            latest.Recovered || '0';
        document.querySelector('#deaths .stat-value').textContent = 
            latest.Deaths || '0';
    }

    function updateTrendChart(data) {
        // Create trend chart
        const trendData = {
            x: data.map(row => row.Date),
            y: data.map(row => row.Confirmed),
            type: 'scatter',
            name: 'Confirmed Cases'
        };

        Plotly.newPlot('trendChart', [trendData], {
            title: 'Cases Trend Over Time',
            xaxis: { title: 'Date' },
            yaxis: { title: 'Number of Cases' }
        });
    }

    function updateGenderDistribution(data) {
        // Calculate gender distribution
        const genderCounts = data.reduce((acc, row) => {
            if (row.Gender) {
                acc[row.Gender] = (acc[row.Gender] || 0) + 1;
            }
            return acc;
        }, {});

        const pieData = [{
            values: Object.values(genderCounts),
            labels: Object.keys(genderCounts),
            type: 'pie',
            hole: 0.4
        }];

        const layout = {
            title: 'Gender Distribution',
            height: 300,
            showlegend: true
        };

        Plotly.newPlot('genderDistribution', pieData, layout);
    }

    function updateAgeDistribution(data) {
        // Define age groups
        const ageGroups = {
            '0-17': 0,
            '18-30': 0,
            '31-50': 0,
            '51-70': 0,
            '70+': 0
        };

        // Calculate age distribution
        data.forEach(row => {
            const age = parseInt(row.Age);
            if (!isNaN(age)) {
                if (age <= 17) ageGroups['0-17']++;
                else if (age <= 30) ageGroups['18-30']++;
                else if (age <= 50) ageGroups['31-50']++;
                else if (age <= 70) ageGroups['51-70']++;
                else ageGroups['70+']++;
            }
        });

        const barData = [{
            x: Object.keys(ageGroups),
            y: Object.values(ageGroups),
            type: 'bar',
            marker: {
                color: '#6366f1'
            }
        }];

        const layout = {
            title: 'Age Distribution',
            height: 300,
            xaxis: { title: 'Age Groups' },
            yaxis: { title: 'Number of Cases' }
        };

        Plotly.newPlot('ageDistribution', barData, layout);
    }
});
