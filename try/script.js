document.addEventListener('DOMContentLoaded', () => {

    // =================================================
    // ANIMACIÓN DE LA ESFERA (CÓDIGO EXISTENTE)
    // =================================================
    const sphereEl = document.querySelector('.sphere-animation');
    if (sphereEl) {
        const spherePathEls = sphereEl.querySelectorAll('.sphere path');
        let sphereAnimations = [];

        const breathAnimation = anime({
            begin: function () {
                for (let i = 0; i < spherePathEls.length; i++) {
                    sphereAnimations.push(anime({
                        targets: spherePathEls[i],
                        stroke: { value: ['rgba(167, 255, 235, 1)', 'rgba(0, 229, 255, 0.2)'], duration: 500 },
                        translateX: [3, -6],
                        translateY: [3, -6],
                        easing: 'easeOutQuad',
                        autoplay: false
                    }));
                }
            },
            update: function (ins) {
                sphereAnimations.forEach(function (animation, i) {
                    const percent = (1 - Math.sin((i * 0.35) + (0.0022 * ins.currentTime))) / 2;
                    animation.seek(animation.duration * percent);
                });
            },
            duration: Infinity,
            autoplay: false
        });

        const introAnimation = anime.timeline({ autoplay: false })
            .add({
                targets: spherePathEls,
                strokeDashoffset: [anime.setDashoffset, 0],
                duration: 3900,
                easing: 'easeInOutCirc',
                delay: anime.stagger(190, { direction: 'reverse' })
            }, 0);

        introAnimation.play();
        breathAnimation.play();
    }


    // =================================================
    // NUEVA: ANIMACIÓN DE ENTRADA DEL FORMULARIO
    // =================================================
    const formFieldsets = document.querySelectorAll('.form-container fieldset, .form-container .primary-btn');
    anime({
        targets: formFieldsets,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800,
        delay: anime.stagger(100, {start: 300}) // Empieza un poco después de la intro de la esfera
    });


    // =================================================
    // NUEVA: ANIMACIÓN DE FOCO EN INPUTS
    // =================================================
    const formInputs = document.querySelectorAll('input[type="text"], input[type="number"], textarea');
    
    formInputs.forEach(input => {
        input.addEventListener('focus', () => {
            anime({
                targets: input,
                borderColor: `rgb(${getComputedStyle(document.documentElement).getPropertyValue('--accent-color')})`,
                boxShadow: `0 0 10px rgba(0, 229, 255, 0.5)`,
                duration: 300,
                easing: 'easeOutQuad'
            });
        });

        input.addEventListener('blur', () => {
            anime({
                targets: input,
                borderColor: 'rgba(0, 229, 255, 0.2)', // Color del borde en :root
                boxShadow: '0 0 0 rgba(0, 229, 255, 0)',
                duration: 500,
                easing: 'easeOutQuad'
            });
        });
    });

    // =================================================
    // NUEVA: ANIMACIÓN DEL BOTÓN PRIMARIO
    // =================================================
    const primaryBtn = document.querySelector('.primary-btn');
    if (primaryBtn) {
        primaryBtn.addEventListener('mouseenter', () => {
            anime({
                targets: primaryBtn,
                scale: 1.05,
                boxShadow: `0 0 20px rgba(0, 229, 255, 0.6)`,
                duration: 200,
                easing: 'easeOutQuad'
            });
        });
        primaryBtn.addEventListener('mouseleave', () => {
            anime({
                targets: primaryBtn,
                scale: 1,
                boxShadow: `0 0 0 rgba(0, 229, 255, 0)`,
                duration: 400,
                easing: 'easeOutQuad'
            });
        });
    }

});