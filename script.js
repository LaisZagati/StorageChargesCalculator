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
    // const numDays = parseInt(document.getElementById('num-days').value) || 0;


    const arrivalDatetime = new Date(document.getElementById('arrival-datetime').value);
    const recoveryDatetime = new Date(document.getElementById('recovery-datetime').value);

    // Calculate the difference in time
    const timeDiff = recoveryDatetime - arrivalDatetime;
    const totalDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Convert milliseconds to days

    // Exclude the first 24 hours
    const effectiveDays = Math.max(totalDays - 1, 0);


    console.log('Inputs:', { weight, airline, shipmentType, numULDs, arrivalDatetime, recoveryDatetime, totalDays, effectiveDays});


    if (effectiveDays <= 0) {
        alert("Recovery Date & Time must be after Arrival Date & Time.");
        return;
    }

    let totalCharge = 0;


    // Calculate storage based on airline and shipment type
    if (airline === "WFS") {
        switch (shipmentType) {
            case "General Cargo":
                totalCharge = calculateWFSGeneralCargo(weight, effectiveDays);
                break;
            case "DG":
                totalCharge = calculateWFSDG(weight, effectiveDays);
                break;
            case "Temp Controlled":
                totalCharge = calculateWFSTempControlled(weight, effectiveDays);
                break;
            case "ULD&Cocoon":
                totalCharge = calculateWFSULDCocoon(weight, effectiveDays, numULDs);
                break;

        }
    } else if (airline === "SWISSPORT") {
        totalCharge = calculateSWISSPORT(weight, effectiveDays);
    } else if (airline === "IAG") {
        totalCharge = calculateIAG(weight, effectiveDays);
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
        <strong>Effective Days Charged:</strong> <span class="days-charged">${effectiveDays} days</span>
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

    // Calculate charge for the first 72 hours
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

    // Calculate charge for the first 72 hours
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
    const doubleDailyRate = dailyRate * 2;
    const doubleMinCharge = minCharge * 2;

    let totalCharge = 0;
    let regularChargeTotal = 0; // To store the total for the regular charge period
    let doubleChargeTotal = 0;  // To store the total for the double charge period

    // Charges start after the first 24 hours
    const effectiveDays = Math.max(days - 1, 0); // Subtract the first 24 hours

    // Calculate charge for the first 2 days
    const first2Days = Math.min(effectiveDays, 2);
    for (let i = 0; i < first2Days; i++) {
        const dailyCharge = Math.max(weight * dailyRate, minCharge);
        regularChargeTotal += dailyCharge;
        totalCharge += dailyCharge;
    }

    // Calculate charge for the remaining days after 72 hours at double the daily rate
    const remainingDays = Math.max(effectiveDays - 2, 0);
    for (let i = 0; i < remainingDays; i++) {
        const dailyDoubleCharge = Math.max(weight * doubleDailyRate, doubleMinCharge);
        doubleChargeTotal += dailyDoubleCharge;
        totalCharge += dailyDoubleCharge;
    }

    // Total charge is the sum of regular and double charges
    totalCharge = regularChargeTotal + doubleChargeTotal;

    console.log('Regular Charge Total:', regularChargeTotal.toFixed(2));
    console.log('Double Charge Total:', doubleChargeTotal.toFixed(2));
    console.log('Total Charge:', totalCharge.toFixed(2));

    return totalCharge;
}






function calculateWFSULDCocoon(weight, numULDs, days) {
    const dailyRate = 0.284;
    const minCharge = 45.48;
    const doubleDailyRate = dailyRate * 2;
    const doubleMinCharge = minCharge * 2;
    const uldCharge = 112.24;

    let totalCharge = 0;
    let regularChargeTotal = 0; // To store the total for the regular charge period
    let doubleChargeTotal = 0;  // To store the total for the double charge period


    // // Calculate the total days from arrival to recovery, counting partial days as full days
    // const totalDays = Math.ceil((recoveryDatetime - arrivalDatetime) / (1000 * 60 * 60 * 24));

    
    // Determine effective days for charges after excluding the first 24 hours
    const effectiveDaysAfter24Hours = Math.max(days - 1, 0); // Subtracting the first 24 hours

    // Calculate charge for the first 2 days (72 hours) at the normal rate
    const first72HoursDays = Math.min(effectiveDaysAfter24Hours, 2);
    for (let i = 0; i < first72HoursDays; i++) {
        const dailyCharge = Math.max(weight * dailyRate, minCharge);
        regularChargeTotal += dailyCharge;
        totalCharge += dailyCharge;
    }


    // Calculate charge for the remaining days after 72 hours at double the daily rate
    const doubleRateDays = Math.max(effectiveDaysAfter24Hours - 2, 0); // Days at double rate
    for (let i = 0; i < doubleRateDays; i++) {
        const dailyDoubleCharge = Math.max(weight * doubleDailyRate, doubleMinCharge);
        doubleChargeTotal += dailyDoubleCharge;
        totalCharge += dailyDoubleCharge;
    }


    // Calculate the ULD charge per day
    const uldTotalCharge = numULDs * uldCharge * days;
    // totalCharge += uldTotalCharge; // Add the ULD charges to the total charge


    // Total charge is the sum of regular and double charges
    totalCharge = regularChargeTotal + doubleChargeTotal + uldTotalCharge


    // Output for debugging
    console.log('Regular Charge Total:', regularChargeTotal.toFixed(2));
    console.log('Double Charge Total:', doubleChargeTotal.toFixed(2));
    console.log('ULD Charge Total:', uldTotalCharge.toFixed(2));
    console.log('Total Charge:', totalCharge.toFixed(2));


    return totalCharge;
}





// SWISSPORT Calculations
function calculateSWISSPORT(weight, days) {
    const baseDailyRate = 0.258;
    const baseMinCharge = 40.12;
    const extraDailyRate = 0.515;
    const extraMinCharge = 80.23;

    let totalCharge = 0;

    // Calculate charge for the first 3 days
    if (days <= 3) {
        // Charge is per day, so multiply by the number of days
        totalCharge = Math.max(weight * baseDailyRate * days, baseMinCharge * days);
    } else {
        // Calculate charge for the first 3 days
        const first3DaysCharge = Math.max(weight * baseDailyRate * 3, baseMinCharge * 3);
        // Calculate charge for the extra days
        const extraDays = days - 3;
        const extraCharge = Math.max(weight * extraDailyRate * extraDays, extraMinCharge * extraDays);
        // Sum of both charges
        totalCharge = first3DaysCharge + extraCharge;
    }

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
