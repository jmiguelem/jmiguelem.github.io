document.getElementById("download-btn").addEventListener("click", function () {
    const element = document.getElementById("content-to-pdf");

    const options = {
        margin: 0.5,
        filename: 'Miguel_Elizalde_Resume.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(options).from(element).save();
});
