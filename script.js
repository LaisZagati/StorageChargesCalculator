/*
This script calculates storage charges based on weight, airline, 
shipment type, number of ULDs, and the number of storage days.
*/

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('storageForm');

    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevents the form from submitting in the traditional way and reloading the page
        calculateTotalCharge(); // Call the function to perform calculations and display results
        form.reset();// Clear the form inputs after calculation
    });
});

function calculateTotalCharge() {
    const weight = parseFloat(document.getElementById('weight').value) || 0;
    const airline = document.getElementById('airline').value;
    const shipmentType = document.getElementById('shipment-type').value;
    const numULDs = parseInt(document.getElementById('num-ulds').value) || 0;
    const numDays = parseInt(document.getElementById('num-days').value) || 0;


    console.log('Inputs:', { weight, airline, shipmentType, numULDs, numDays });


    if (numDays <= 0) {
        alert("Number of storage days must be greater than zero.");
        return;
    }
    let totalCharge = 0;

    // Calculate storage based on airline and shipment type
    if (airline === "WFS") {
        switch (shipmentType) {
            case "General Cargo":
                totalCharge = calculateWFSGeneralCargo(weight, numDays);
                break;
            case "DG":
                totalCharge = calculateWFSDG(weight, numDays);
                break;
            case "Temp Controlled":
                totalCharge = calculateWFSTempControlled(weight, numDays);
                break;
            case "ULD&Cocoon":
                totalCharge = calculateWFSULDCocoon(weight, numDays, numULDs);
                break;

        }
    } else if (airline === "SWISSPORT") {
        totalCharge = calculateSWISSPORT(weight, numDays);
    } else if (airline === "IAG") {
        totalCharge = calculateIAG(weight, numDays);
    }

    // Apply minimum charge if necessary
    totalCharge = Math.max(totalCharge, getMinCharge(airline, shipmentType));


    console.log('Total Charge:', totalCharge);


    // Display total charge
    document.getElementById('totalCharge').innerHTML = `
    <div id="totalCharge">
        <strong>Total Charge:</strong> <span class="charge-amount">€${totalCharge.toFixed(2)}</span><br>
        <strong>Airline:</strong> <span class="airline">${airline}</span><br>
        <strong>Shipment Type:</strong> <span class="shipment-type">${shipmentType}</span><br>
        <strong>Weight:</strong> <span class="weight">${weight} kg</span><br>
        <strong>Number of ULDs:</strong> <span class="ulds">${numULDs}</span><br>
        <strong>Number of Days Charged:</strong> <span class="days-charged">${numDays} days</span>
    </div>
`;


    // // Clear the form inputs after calculation
    // form.reset();

}



// WFS Calculations

function calculateWFSGeneralCargo(weight, days) {
    const dailyRate = 0.26;
    const minCharge = 39.33;

    let totalCharge = 0;

    // Calculate charge for the first 3 days
    const first72Hours = Math.min(days, 3);
    for (let i = 0; i < first72Hours; i++) {
        totalCharge += Math.max(weight * dailyRate, minCharge);
    }

    // Calculate charge for the days after 72 hours at double the daily rate
    const extraDays = Math.max(days - 3, 0);
    for (let i = 0; i < extraDays; i++) {
        totalCharge += Math.max(weight * dailyRate * 2, minCharge * 2);
    }

    return totalCharge;
}

function calculateWFSDG(weight, days) {
    const dailyRate = 0.41;
    const minCharge = 57.17;

    let totalCharge = 0;

    // Calculate charge for the first 3 days
    const first72Hours = Math.min(days, 3);
    for (let i = 0; i < first72Hours; i++) {
        totalCharge += Math.max(weight * dailyRate, minCharge);
    }

    // Calculate charge for the days after 72 hours at double the daily rate
    const extraDays = Math.max(days - 3, 0);
    for (let i = 0; i < extraDays; i++) {
        totalCharge += Math.max(weight * dailyRate * 2, minCharge * 2);
    }

    return totalCharge;
}

function calculateWFSTempControlled(weight, days) {
    const dailyRate = 0.284;
    const minCharge = 45.48;

    let totalCharge = 0;

    // Calculate charge for the first 3 days
    const first72Hours = Math.min(days, 3);
    for (let i = 0; i < first72Hours; i++) {
        totalCharge += Math.max(weight * dailyRate, minCharge);
    }

    // Calculate charge for the days after 72 hours at double the daily rate
    const extraDays = Math.max(days - 3, 0);
    for (let i = 0; i < extraDays; i++) {
        totalCharge += Math.max(weight * dailyRate * 2, minCharge * 2);
    }

    return totalCharge;
}

function calculateWFSULDCocoon(weight, days, numULDs) {
    const dailyRate = 0.284;
    const minCharge = 45.48;
    const uldCharge = 112.24;

    // Calculate charge for the first 3 days
    const first3Days = Math.min(days, 3);
    let first3DaysCharge = 0;
    for (let i = 0; i < first3Days; i++) {
        // Apply minimum charge for weight per day
        first3DaysCharge += Math.max(weight * dailyRate, minCharge);
    }

    // Calculate charge for the days after 72 hours at double the daily rate
    const extraDays = Math.max(days - 3, 0);
    let extraCharge = 0;
    for (let i = 0; i < extraDays; i++) {
        // Apply minimum charge for weight per day, and double the daily rate
        extraCharge += Math.max(weight * dailyRate * 2, minCharge * 2);
    }

    // Calculate the ULD charge
    const uldTotalCharge = numULDs * uldCharge * days;

    // Total charge is the sum of the weight charge and ULD charge
    const totalCharge = first3DaysCharge + extraCharge + uldTotalCharge;

    return totalCharge;
}



// IAG Calculations
function calculateIAG(weight, days) {
    const dailyRate = 0.25;
    const minCharge = 38.00;
    return Math.max(weight * dailyRate * days, minCharge * days);
}

// Helper function to get minimum charge based on airline and shipment type
function getMinCharge(airline, shipmentType) {
    if (airline === "WFS") {
        switch (shipmentType) {
            case "General Cargo":
                return 39.33;
            case "DG":
                return 57.17;
            case "Temp Controlled":
            case "ULD&Cocoon":
                return 45.48;
        }
    } else if (airline === "SWISSPORT") {
        return 40.12;
    } else if (airline === "IAG") {
        return 38.00;
    }
    return 0; // Default - Shouldn't happen
}