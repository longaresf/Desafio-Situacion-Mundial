
// Evento de submit del formulario que inicia sesión, generando un JWT
// que se guarda en LocalStorage.
// Se validan campos vacíos y contraseña incorrecta
// Si todo está bien se genera un JWT que se guarda en LocalStorage
// A partir de la función getDatos() se generan el gráfico y la tabla
// Se oculta el formulario y se muestran los datos
$('#js-form').submit(async (event) => {
    event.preventDefault();
    const email = document.getElementById('js-input-email').value;
    const password = document.getElementById('js-input-password').value;
    
    if((email==='') || (password==='')) {
        alert('Debe llenar todos los campos del formulario');
    }
    else if ((password != 'secret')){
        alert('Contraseña incorrecta');
    }
    else
    {
        const JWT = await postData(email,password);
        const datos = await getDatos(JWT);
        mostrarGrafico(datos);
        mostrarTabla(datos);
        toggleFormAndContainer();
    }
})

// Función asíncrona para generar el JWT
const postData = async (email,password) => {
    try {
        const response = await fetch('http://localhost:3000/api/login',
        {
            method:'POST',
            body: JSON.stringify({email:email,password:password})
        })
        const { token } = await response.json();
        localStorage.setItem('jwt-token',token);
        return token;
    }
    catch (err) {
        console.log(`Error: ${err}`);
    }
}

// Función asíncrona para solicitar los datos
const getDatos = async (jwt) => {
    try {
        const response = await fetch('http://localhost:3000/api/total',
        {
            method:'GET',
            headers: {
                Authorization: `Bearer ${jwt}`
            }
        });
        const { data } = await response.json();
        return data;
    }
    catch (err) {
        console.log(`Error: ${err}`);
    }
}

// Función para generar y mostrar el gráfico
const mostrarGrafico = (data) => {
    let masDe10000 = data.filter(elemento => {
        return elemento.active > 10000;
    })
    /* console.log(masDe10000); */

    let activos = [];
    masDe10000.forEach(elemento => {
        activos.push({y: elemento.active, label: elemento.location});
        return activos;
        /* console.log(activos); */
    })

    var chart = new CanvasJS.Chart("chartContainer", {
        animationEnabled: true,
        theme: "light2", // "light1", "light2", "dark1", "dark2"
        title:{
            text: "Paises con Covid19"
        },
        axisY: {
            title: ""
        },
        data: [{        
            type: "column", 
            indexLabelPlacement: "outside",
            indexLabel: "{label}  {y}",
            indexLabelOrientation: "vertical",
            dataPoints: activos,
        },     
    ]
    });
    chart.render();
}

// Función para mostrar la tabla con todos los datos
const mostrarTabla = (data) => {

    let containerTabla = document.getElementById('container-tabla');

    let tabla1 ="<tr><th>Locación</th><th>Confirmados</th><th>Muertos</th><th>Recuperados</th><th>Activos</th><th>Detalle</th></tr>";

    /* let datas = data; */
    for ( let i=0; i < data.length ; i++) {
         
        tabla1 += `
                    <tr>
                        <td>${data[i].location}</td>
                        <td>${data[i].confirmed}</td>
                        <td>${data[i].deaths}</td>
                        <td>${data[i].recovered}</td>
                        <td>${data[i].active}</td>
                        <td><button id='btn-toggle-modal${i}' type="button" class="btn btn-primary" data-pais=${data[i].location}> 
                        Ver detalle
                      </button></td>
                    </tr>
                    `;
    };

    containerTabla.innerHTML = tabla1;

    for ( let i=0; i < data.length ; i++){
        let boton = document.getElementById(`btn-toggle-modal${i}`);
    
        $(`#btn-toggle-modal${i}`).click( async ()=>{
            $("#exampleModal").modal('show')
    
            pais = boton.dataset.pais;

            const token = localStorage.getItem('jwt-token');
            let dataPais = await getPais(token,pais);

            mostrarGrafico2(dataPais);
                    
        });
    }
}

// Función que muestra el gráfico y la tabla, y oculta el formulario al 
// según el evento correspondiente, y viceversa
const toggleFormAndContainer = () => {
    $('#container-formulario').toggle();
    $('#cerrar-sesion').toggle();
    $(".flexbox").toggleClass("hidden");
}

/* ------------------------------------------------------ */

// Función para solicitar datos de cada país
const getPais = async (jwt,country) => {
    try {
        const response = await fetch(`http://localhost:3000/api/countries/${country}`,
        {
            method:'GET',
            headers: {
                Authorization: `Bearer ${jwt}`
            }
        });
        const { data } = await response.json();
        return data;
    }
    catch (err) {
        console.log(`Error: ${err}`);
    }
}

// Función para mostrar el gráfico con detalles para cada país
const mostrarGrafico2 = (data) => {
    var chart = new CanvasJS.Chart("chartContainer2", {
        animationEnabled: true,
        theme: "light2", // "light1", "light2", "dark1", "dark2"
        title:{
            text: data.location
        },
        axisY: {
            title: ""
        },
        data: [{        
            type: "column", 
            indexLabelPlacement: "outside",
            indexLabel: "{y}",
            indexLabelOrientation: "horizontal",
            dataPoints: [
                { y: data.confirmed, label: "Confirmados"},
                { y: data.deaths, label: "Muertos"},
                { y: data.recovered, label: "Recuperados"},
                { y: data.active, label: "Activos"}
                ],
        },     
    ]
    });
    chart.render();
}

// Si el JWT esta guardado en LocalStorage carga automáticamente
// el gráfico y la tabla
const init = (async () => {

    document.getElementById('js-input-email').value = '';
    document.getElementById('js-input-password').value = '';

    const token = localStorage.getItem('jwt-token');
    if(token){
        const datos = await getDatos(token);
        mostrarGrafico(datos);
        mostrarTabla(datos);
        toggleFormAndContainer();
    }
})();

// Evento de click de botón para cerrar sesión, recarga la página inicial
// y borra el JWT guardado
$('#cerrar-sesion').click(() => {
    localStorage.clear();
    window.location.reload();
});