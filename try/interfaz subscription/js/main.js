document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA PARA EL FONDO DE PARTÍCULAS ---
    tsParticles.load("tsparticles", {
        fpsLimit: 60,
        interactivity: {
            events: {
                onHover: { enable: true, mode: "grab" },
                resize: true
            },
            modes: {
                grab: {
                    distance: 150,
                    links: { opacity: 0.3, color: "#14f1d9" }
                }
            }
        },
        particles: {
            color: { value: "#ffffff" },
            move: {
                direction: "none",
                enable: true,
                outModes: "out",
                random: true,
                speed: 1,
                straight: false
            },
            number: {
                density: { enable: true, area: 800 },
                value: 60
            },
            opacity: { value: { min: 0.1, max: 0.4 } },
            shape: { type: "circle" },
            size: { value: { min: 1, max: 3 } }
        },
    });

    // --- LÓGICA DEL LOADER DE FORMAS GEOMÉTRICAS ---
    const loaderCanvas = document.querySelector('.loader-canvas');
    if (loaderCanvas) {
        const numShapes = 20;
        for (let i = 0; i < numShapes; i++) {
            const shape = document.createElement('div');
            shape.classList.add('shape');
            if (Math.random() > 0.5) { shape.classList.add('circle'); } 
            else { shape.classList.add('square'); }
            const size = anime.random(10, 35);
            shape.style.width = `${size}px`;
            shape.style.height = `${size}px`;
            shape.style.top = `${anime.random(0, 85)}%`;
            shape.style.left = `${anime.random(0, 85)}%`;
            loaderCanvas.appendChild(shape);
        }
        anime({
            targets: '.shape',
            translateX: () => anime.random(-80, 80),
            translateY: () => anime.random(-80, 80),
            rotate: () => anime.random(-360, 360),
            scale: () => anime.random(0.5, 1.5),
            duration: () => anime.random(3000, 6000),
            easing: 'easeInOutSine',
            direction: 'alternate',
            loop: true
        });
    }

    // --- LÓGICA PARA MOSTRAR LA INTERFAZ TRAS EL LOADER ---
    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => {
            anime({
                targets: loader,
                opacity: 0,
                duration: 500,
                easing: 'easeOutExpo',
                complete: () => {
                    loader.style.display = 'none';
                }
            });
        }, 3000); // Duración del loader
    }

    // --- LÓGICA DEL TOGGLE MENSUAL/ANUAL CON DESCUENTO ---
    const toggleCheckbox = document.getElementById('plan-toggle-checkbox');
    const monthlyLabel = document.getElementById('monthly-label');
    const annualLabel = document.getElementById('annual-label');

    function updatePrices(isAnnual) {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            if (isAnnual) { card.classList.add('show-annual'); } 
            else { card.classList.remove('show-annual'); }
        });
        if (monthlyLabel && annualLabel) {
            monthlyLabel.classList.toggle('active', !isAnnual);
            annualLabel.classList.toggle('active', isAnnual);
        }
    }

    if (toggleCheckbox) {
        toggleCheckbox.addEventListener('change', () => updatePrices(toggleCheckbox.checked));
        updatePrices(false);
    }

    // --- LÓGICA DE ANIMACIÓN AL HACER SCROLL ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const delay = Array.from(entry.target.parentElement.children).indexOf(entry.target) * 100;
                setTimeout(() => {
                    entry.target.classList.add('is-visible');
                }, delay);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
});