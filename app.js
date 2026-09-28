// 1. ตั้งค่าแผนที่เริ่มต้นที่กรุงเทพมหานคร
const map = L.map('map').setView([13.7563, 100.5018], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// 2. ระบบฐานข้อมูลบนมือถือ (Local Storage)
let savedFloods = JSON.parse(localStorage.getItem('myFloodPins')) || [];

// ฟังก์ชันสำหรับวาดวงกลมน้ำท่วมและโชว์ตัวเลขตลอดเวลา
function drawFloodPin(lat, lng, level) {
    let color = '#28a745'; // สีเขียว
    if (level > 30) {
        color = '#dc3545'; // สีแดง
    } else if (level > 10) {
        color = '#ffc107'; // สีเหลือง
    }

    // สร้างวงกลมบนแผนที่
    let marker = L.circleMarker([lat, lng], {
        radius: 20, // ขยายวงกลมให้ใหญ่ขึ้นนิดหน่อยเพื่อใส่ตัวเลข
        fillColor: color,
        color: color,
        weight: 2,
        opacity: 1,
        fillOpacity: 0.7
    }).addTo(map);
    
    // โชว์ตัวเลขระดับน้ำขึ้นมาบนแผนที่ทันทีโดยไม่ต้องคลิก
    marker.bindTooltip(`<b>${level} ซม.</b>`, {
        permanent: true, 
        direction: 'center',
        className: 'flood-label' // CSS class เผื่อตกแต่งเพิ่ม
    });
}

// โหลดหมุดน้ำท่วมเดิมที่เคยบันทึกไว้ขึ้นมาแสดง
savedFloods.forEach(pin => {
    // ป้องกัน Error จากหมุดเวอร์ชันเก่าที่ไม่มีตัวเลขระดับน้ำ
    if(pin.level !== undefined) {
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
            
            drawFloodPin(lat, lng, level);
            
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
