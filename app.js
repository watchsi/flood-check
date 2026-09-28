// 1. ตั้งค่าแผนที่เริ่มต้นที่กรุงเทพมหานคร
const map = L.map('map').setView([13.7563, 100.5018], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// 2. ระบบฐานข้อมูลบนมือถือ (Local Storage)
let savedFloods = JSON.parse(localStorage.getItem('myFloodPins')) || [];

// ฟังก์ชันสำหรับวาดวงกลมน้ำท่วมและแยกสีตามความรุนแรง
function drawFloodPin(lat, lng, level) {
    let color = '#28a745'; // สีเขียว (น้ำขังเล็กน้อย ไม่เกิน 10 ซม.)
    if (level > 30) {
        color = '#dc3545'; // สีแดง (น้ำท่วมสูงเกิน 30 ซม. รถเล็กผ่านไม่ได้)
    } else if (level > 10) {
        color = '#ffc107'; // สีเหลือง (น้ำท่วมปานกลาง 11-30 ซม.)
    }

    // สร้างวงกลมบนแผนที่
    L.circleMarker([lat, lng], {
        radius: 15,
        fillColor: color,
        color: color,
        weight: 2,
        opacity: 1,
        fillOpacity: 0.7
    }).addTo(map)
      .bindPopup(`<div style="text-align:center;"><b>ระดับน้ำท่วม</b><br><span style="font-size:20px; color:${color};">${level} ซม.</span></div>`);
}

// โหลดหมุดน้ำท่วมเดิมที่เคยบันทึกไว้ขึ้นมาแสดง
savedFloods.forEach(pin => {
    drawFloodPin(pin.lat, pin.lng, pin.level);
});

// 3. เมื่อผู้ใช้แตะที่แผนที่ ให้มีกล่องเด้งถามระดับน้ำ
map.on('click', function(e) {
    // ถามระดับน้ำจากผู้ใช้
    let levelInput = prompt("ระบุความสูงของน้ำท่วมบริเวณนี้ (เซนติเมตร):", "15");
    
    // ถ้ายกเลิก หรือไม่กรอกตัวเลข จะไม่ทำงาน
    if (levelInput !== null && levelInput !== "") {
        let level = parseInt(levelInput);
        
        if(!isNaN(level)) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            
            // วาดวงกลมลงแผนที่
            drawFloodPin(lat, lng, level);
            
            // บันทึกลงฐานข้อมูลในมือถือ
            savedFloods.push({lat: lat, lng: lng, level: level});
            localStorage.setItem('myFloodPins', JSON.stringify(savedFloods));
        } else {
            alert("กรุณากรอกตัวเลขเท่านั้นครับ");
        }
    }
});

// 4. ระบบค้นหาสถานที่ (Geocoding API ฟรี)
async function searchLocation() {
    const query = document.getElementById('searchInput').value;
    if(!query) return alert("กรุณาพิมพ์ชื่อสถานที่");

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query} กรุงเทพมหานคร`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if(data.length > 0) {
            const lat = data[0].lat;
            const lon = data[0].lon;
            map.setView([lat, lon], 16); 
            // หมุดค้นหาใช้สีฟ้าปกติ เพื่อไม่ให้สับสนกับหมุดน้ำท่วม
            L.marker([lat, lon]).addTo(map).bindPopup(`<b>ผลการค้นหา:</b><br>${data[0].display_name}`).openPopup();
        } else {
            alert("ไม่พบสถานที่ ลองเปลี่ยนคำค้นหาครับ");
        }
    } catch (error) {
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย");
    }
}

// 5. ลงทะเบียน Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js');
    });
}
