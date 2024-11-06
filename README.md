Storage Charges Calculator

Overview

This Storage Charges Calculator is a web application designed to simplify the calculation of storage fees based on weight, time, and other criteria such as shipment type and airline. The project provides a clean, intuitive form for users to input key information and get instant feedback on calculated charges, streamlining a previously complex process.

How I Built It

HTML Layout:

I created a structured, responsive HTML layout, including input fields for key data points such as weight, arrival and recovery dates, airline, and shipment type.
The form elements are organized for easy navigation and clarity, with labels and placeholders to guide users through each field.

Responsive Styling:

The layout is responsive and adapts well to various screen sizes due to the meta viewport and CSS in style.css.
Clear headings and field separators keep the form clean and easy to read, enhancing user experience.
JavaScript for Calculation and Form Interactivity:

A JavaScript file (script.js) manages the dynamic calculations based on form inputs, providing instant feedback on storage charges when the form is submitted.
Users are prompted to input the arrival and recovery dates, which helps calculate the duration of storage for an accurate charge calculation.

Conditional Inputs:

I included conditional fields for specific shipment types, such as the number of ULDs, making the form adaptable to different use cases.
The application detects when additional input fields are necessary (like the number of ULDs for specific shipment types), keeping the form compact when these options aren’t needed.

Validation:

Required fields and constraints ensure that users input accurate information, minimizing errors in the final calculations.

This project helped me practice dynamic form handling and calculations, building a user-friendly interface for specific real-world use cases in logistics and storage management.
