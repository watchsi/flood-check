// 1. ตั้งค่าแผนที่เริ่มต้นที่กรุงเทพมหานคร
const map = L.map('map').setView([13.7563, 100.5018], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// 2. ระบบฐานข้อมูลบนมือถือ (Local Storage)
let savedFloods = JSON.parse(localStorage.getItem('myFloodPins')) || [];

// ฟังก์ชันสำหรับวาดวงกลมน้ำท่วมและโชว์ "ตัวเลขระดับน้ำ" ตลอดเวลา
function drawFloodPin(lat, lng, level) {
    let color = '#28a745'; // สีเขียว (น้ำไม่เกิน 10 ซม.)
    if (level > 30) {
        color = '#dc3545'; // สีแดง (น้ำเกิน 30 ซม.)
    } else if (level > 10) {
        color = '#ffc107'; // สีเหลือง (น้ำ 11-30 ซม.)
    }

    // สร้างวงกลมบอกความรุนแรง
    let marker = L.circleMarker([lat, lng], {
        radius: 20, 
        fillColor: color,
        color: '#333',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7
    }).addTo(map);
    
    // โชว์ตัวเลขระดับน้ำขึ้นมาบนแผนที่ทันที โดยใช้ class CSS 'flood-label'
    marker.bindTooltip(`${level} ซม.`, {
        permanent: true, 
        direction: 'center',
        className: 'flood-label' 
    });
}

// โหลดหมุดน้ำท่วมเดิมที่เคยบันทึกไว้ขึ้นมาแสดง (กรองเฉพาะอันที่มีระดับน้ำ)
savedFloods.forEach(pin => {
    if(pin.level !== undefined && pin.level !== null) {
        drawFloodPin(pin.lat, pin.lng, pin.level);
    }
});

// 3. เมื่อผู้ใช้แตะที่แผนที่ ให้ถามระดับน้ำ
map.on('click', function(e) {
    let levelInput = prompt("ระบุความสูงของน้ำท่วมบริเวณนี้ (เซนติเมตร):", "15");
    
    if (levelInput !== null && levelInput !== "") {
        let level = parseInt(levelInput);
        
        if(!isNaN(level)) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            
            // วาดวงกลมพร้อมตัวเลขลงแผนที่
            drawFloodPin(lat, lng, level);
            
            // บันทึกลงเครื่องผู้ใช้
            savedFloods.push({lat: lat, lng: lng, level: level});
            localStorage.setItem('myFloodPins', JSON.stringify(savedFloods));
        } else {
            alert("กรุณากรอกตัวเลขเท่านั้นครับ");
        }
    }
});

// 4. ระบบค้นหาสถานที่
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
