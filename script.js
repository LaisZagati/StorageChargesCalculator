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

    const arrivalDatetime = new Date(document.getElementById('arrival-datetime').value);
    const recoveryDatetime = new Date(document.getElementById('recovery-datetime').value);

    // Calculate the difference in time in milliseconds and count as a full day
    const timeDiff = recoveryDatetime - arrivalDatetime;
    const totalDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Convert milliseconds to days

    // Directly use totalDays for General Cargo (no need to exclude first 24 hours)
    const effectiveDays = totalDays;

    console.log('Inputs:', { weight, airline, shipmentType, numULDs, arrivalDatetime, recoveryDatetime, totalDays, effectiveDays });

    let totalCharge = 0;

    // Calculate storage based on airline and shipment type
    if (airline === "WFS") {
        switch (shipmentType) {
            case "General Cargo":
                totalCharge = calculateWFSGeneralCargo(weight, arrivalDatetime, recoveryDatetime);
                break;
            case "DG":
                totalCharge = calculateWFSDG(weight, arrivalDatetime, recoveryDatetime);
                break;
            case "Temp Controlled":
                totalCharge = calculateWFSTempControlled(weight, effectiveDays);
                break;
            case "ULD&Cocoon":
                totalCharge = calculateWFSULDCocoon(weight, numULDs, effectiveDays);
                break;
        }
    } else if (airline === "SWISSPORT") {
        totalCharge = calculateSWISSPORT(weight, arrivalDatetime, recoveryDatetime);
    } else if (airline === "IAG") {
        totalCharge = calculateIAG(weight, effectiveDays, arrivalDatetime, recoveryDatetime);
    }

    console.log(`Total Charge before applying min charge: €${totalCharge}`);

    // Apply minimum charge only if the total charge is 0
    const minCharge = getMinCharge(airline, shipmentType);
    if (totalCharge === 0) {
        totalCharge = 0 ; // Apply minimum charge only if no charge was applied
    }

    console.log('Final Total Charge:', totalCharge);

    // Display total charge
    document.getElementById('totalCharge').innerHTML = `
    <div id="totalCharge">
        <strong>Total Charge:</strong> <span class="charge-amount">€${totalCharge.toFixed(2)}</span><br>
        <strong>Ground Handling Agent:</strong> <span class="airline">${airline}</span><br>
        <strong>Shipment Type:</strong> <span class="shipment-type">${shipmentType}</span><br>
        <strong>Weight:</strong> <span class="weight">${weight} kg</span><br>
        <strong>Number of ULDs:</strong> <span class="ulds">${numULDs}</span><br>
    </div>
    `;
}


function calculateStorageStart(arrivalDatetime) {
    // Check if arrivalDatetime is valid
    if (!(arrivalDatetime instanceof Date) || isNaN(arrivalDatetime.getTime())) {
        console.error("Invalid arrival date provided to calculateStorageStart");
        return new Date(); // Return the current date or handle it as needed
    }
    
    const arrivalDay = arrivalDatetime.getDay(); // Get the day of the week (0 = Sunday, 6 = Saturday)
    let storageStartDatetime = new Date(arrivalDatetime); // Start with the arrival date

    switch (arrivalDay) {
        case 0: // Sunday
        case 6: // Saturday
            storageStartDatetime.setDate(arrivalDatetime.getDate() + 3); // Wednesday
            break;
        case 1: // Monday
            storageStartDatetime.setDate(arrivalDatetime.getDate() + 2); // Wednesday
            break;
        case 2: // Tuesday
            storageStartDatetime.setDate(arrivalDatetime.getDate() + 2); // Thursday
            break;
        case 3: // Wednesday
            storageStartDatetime.setDate(arrivalDatetime.getDate() + 2); // Friday
            break;
        case 4: // Thursday
            storageStartDatetime.setDate(arrivalDatetime.getDate() + 2); // Saturday
            break;
        case 5: // Friday
            storageStartDatetime.setDate(arrivalDatetime.getDate() + 4); // Tuesday
            break;
    }

    // Set storage start time to 00:01 on the calculated day
    storageStartDatetime.setHours(0, 1, 0, 0);
    
    return storageStartDatetime;
}


function calculateWFSGeneralCargo(weight, arrivalDatetime, recoveryDatetime) {
    const arrivalDate = new Date(arrivalDatetime);
    const storageStartDatetime = calculateStorageStart(arrivalDate); // Calculate storage start date
    const recoveryDate = new Date(recoveryDatetime);

    // Calculate effective days based on arrival to recovery time
    const effectiveDays = Math.ceil((recoveryDate - arrivalDate) / (1000 * 60 * 60 * 24)); 

    // Calculate regular charges only for the storage start day
    const isRegularChargeApplicable = storageStartDatetime <= recoveryDate;

    // Calculate total charge
    const dailyRate = 0.26;
    const minCharge = 39.33;

    let regularChargeTotal = 0;
    let doubleChargeTotal = 0;

    // Regular charge for the first day after storage start
    if (isRegularChargeApplicable) {
        regularChargeTotal = Math.max(weight * dailyRate, minCharge);
    }

    // Calculate double charge days
    const doubleChargeStartDate = new Date(arrivalDate);
    doubleChargeStartDate.setHours(doubleChargeStartDate.getHours() + 72); // Add 72 hours to arrival date

    // Check how many hours/days are considered for double charges
    if (recoveryDate > doubleChargeStartDate) {
        const doubleChargeDays = Math.ceil((recoveryDate - doubleChargeStartDate) / (1000 * 60 * 60 * 24));
        doubleChargeTotal = Math.max(weight * dailyRate * 2, minCharge * 2) * doubleChargeDays;
    }

    const totalCharge = regularChargeTotal + doubleChargeTotal;

    console.log(`Storage starts on: ${storageStartDatetime}`);
    console.log(`Effective Days Charged: ${effectiveDays}`);
    console.log('Regular Charge Total:', regularChargeTotal.toFixed(2));
    console.log('Double Charge Total:', doubleChargeTotal.toFixed(2));
    console.log('Total Charge:', totalCharge.toFixed(2));

    return totalCharge;
}



function calculateWFSDG (weight, arrivalDatetime, recoveryDatetime) {
    const arrivalDate = new Date(arrivalDatetime);
    const storageStartDatetime = calculateStorageStart(arrivalDate); // Calculate storage start date
    const recoveryDate = new Date(recoveryDatetime);

    // Calculate effective days based on arrival to recovery time
    const effectiveDays = Math.ceil((recoveryDate - arrivalDate) / (1000 * 60 * 60 * 24)); 

    // Calculate regular charges only for the storage start day
    const isRegularChargeApplicable = storageStartDatetime <= recoveryDate;

    // Calculate total charge
    const dailyRate = 0.41;
    const minCharge = 57.17;

    let regularChargeTotal = 0;
    let doubleChargeTotal = 0;

    // Regular charge for the first day after storage start
    if (isRegularChargeApplicable) {
        regularChargeTotal = Math.max(weight * dailyRate, minCharge);
    }

    // Calculate double charge days
    const doubleChargeStartDate = new Date(arrivalDate);
    doubleChargeStartDate.setHours(doubleChargeStartDate.getHours() + 72); // Add 72 hours to arrival date

    // Check how many hours/days are considered for double charges
    if (recoveryDate > doubleChargeStartDate) {
        const doubleChargeDays = Math.ceil((recoveryDate - doubleChargeStartDate) / (1000 * 60 * 60 * 24));
        doubleChargeTotal = Math.max(weight * dailyRate * 2, minCharge * 2) * doubleChargeDays;
    }

    const totalCharge = regularChargeTotal + doubleChargeTotal;

    console.log(`Storage starts on: ${storageStartDatetime}`);
    console.log(`Effective Days Charged: ${effectiveDays}`);
    console.log('Regular Charge Total:', regularChargeTotal.toFixed(2));
    console.log('Double Charge Total:', doubleChargeTotal.toFixed(2));
    console.log('Total Charge:', totalCharge.toFixed(2));

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

    
    // Determine effective days for charges after excluding the first 24 hours
    const effectiveDays = Math.max(days - 1, 0); // Subtracting the first 24 hours

    // Calculate charge for the first 2 days (72 hours) at the normal rate
    const first2Days = Math.min(effectiveDays, 2);
    for (let i = 0; i < first2Days; i++) {
        const dailyCharge = Math.max(weight * dailyRate, minCharge);
        regularChargeTotal += dailyCharge;
        totalCharge += dailyCharge;
    }


    // Calculate charge for the remaining days after 72 hours at double the daily rate
    const remainingDays = Math.max(effectiveDays - 2, 0); // Days at double rate
    for (let i = 0; i < remainingDays; i++) {
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


function calculateSWISSPORT(weight, arrivalDatetime, recoveryDatetime) {
    // Ensure valid Date
    const arrivalDate = new Date(arrivalDatetime);
    const storageStartDatetime = calculateStorageStart(arrivalDate);
    const timeDiff = recoveryDatetime - arrivalDate; // Time difference from arrival to recovery

    // Effective days charged from arrival date to recovery date
    const effectiveDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Convert to days
    console.log(`Storage starts on: ${storageStartDatetime}`);
    console.log(`Effective Days Charged: ${effectiveDays}`);

    const baseDailyRate = 0.258; // Daily rate for regular charges
    const baseMinCharge = 40.12;  // Minimum charge for regular charges
    const extraDailyRate = 0.515;  // Daily rate for double charges
    const extraMinCharge = 80.23;   // Minimum charge for double charges

    let totalCharge = 0;
    let regularChargeTotal = 0;
    let doubleChargeTotal = 0;

    // Calculate charges
    const arrivalTime = arrivalDate.getTime();
    const storageStartTime = storageStartDatetime.getTime();

    // Determine when double charges begin
    const doubleChargeStartTime = arrivalTime + (72 * 60 * 60 * 1000); // 72 hours in milliseconds
    const doubleChargeDays = Math.max(0, Math.floor((recoveryDatetime - doubleChargeStartTime) / (1000 * 60 * 60 * 24))); // Calculate double charge days

    // Regular charge for the first day only
    if (storageStartTime < recoveryDatetime) {
        regularChargeTotal = Math.max(weight * baseDailyRate, baseMinCharge);
    }

    // Double charge for the days after 72 hours
    if (doubleChargeDays > 0) {
        doubleChargeTotal = Math.max(weight * extraDailyRate * doubleChargeDays, extraMinCharge * doubleChargeDays);
    }

    totalCharge = regularChargeTotal + doubleChargeTotal;

    console.log('Regular Charge Total:', regularChargeTotal.toFixed(2));
    console.log('Double Charge Total:', doubleChargeTotal.toFixed(2));
    console.log('Total Charge:', totalCharge.toFixed(2));

    return totalCharge;
}





// IAG Calculations
function calculateIAG(weight, days, arrivalDatetime, recoveryDatetime) {
    const storageStartDatetime = calculateStorageStart(arrivalDatetime); // Get the storage start date
    const timeDiff = recoveryDatetime - storageStartDatetime; // Time difference from storage start to recovery date
    const effectiveDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Convert time difference to full days

    console.log(`Storage starts on: ${storageStartDatetime}`);
    console.log(`Recovery Date: ${recoveryDatetime}`);
    console.log(`Effective Days Charged: ${effectiveDays}`);

    const dailyRate = 0.25;
    const minCharge = 38.00;

    console.log(`Daily rate: ${dailyRate}`);
    console.log(`Min Charge: ${minCharge}`);
    
    // Calculate total charge based on weight, daily rate, and effective days
    return Math.max(weight * dailyRate * effectiveDays, minCharge * effectiveDays);
    console.log(`Total Charge: €${totalCharge.toFixed(2)}`);

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
