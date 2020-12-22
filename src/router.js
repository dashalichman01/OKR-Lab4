let Router = {
    // маршруты и соответствующие им обработчики
    routes: {
        "/":                "index", // +
        "/catalog":         "catalogIndex", // +
        "/catalog/:id":     "catalogShow", // +
        "/product/:id":     "productShow",
        "/actions":         "actionIndex", // +
        "/actions/:id":     "actionShow", // +
        "/cart":            "cartShow",
        "/order":           "orderIndex",
        "/order/:id":       "orderShow",
    },

    // метод проходится по массиву routes и создает
    // создает объект на каждый маршрут
    init: function() {
        // объявляем свойство _routes
        this._routes = [];
        for( let route in this.routes ) {

            // имя метода-обрaботчика
            let method = this.routes[route];

            // добавляем в массив роутов объект
            this._routes.push({

                // регулярное выражение с которым будет сопоставляться ссылка
                // ее надо преобразовать из формата :tag в RegEx
                // модификатор g обязателен
                pattern: new RegExp('^' + route.replace(/:\w+/g,'(\\w+)') + '$'),

                // метод-обработчик
                // определяется в объекте Route
                // для удобства
                callback: this[method]
            });
        }
    },

    showView: function (name, data) {
        return new Promise(function(resolve, reject) {
            let view = document.querySelector("#views");

            let request;
            let url = './views/'+name+'.html';

            if (window.XMLHttpRequest)
            {
                request = new XMLHttpRequest();
                request.onreadystatechange = processRequestChange;
                request.open("GET", url, true);
                request.send(null);
            }
            else if (window.ActiveXObject)
            {
                request = new ActiveXObject("Microsoft.XMLHTTP");
                if (request)
                {
                    request.onreadystatechange = processRequestChange;
                    request.open("GET", url, true);
                    request.send();
                }
            }

            function processRequestChange()
            {
                if (request.readyState == 4)
                {
                    let result = request.responseText;
                    if(view) {
                        let template = Handlebars.compile(result);
                        let html = template(data);
                        view.innerHTML = html;
                        resolve();
                    }
                }
            }
        })

    },

    dispatch: function(path) {

        // количество маршрутов в массиве
        let i = this._routes.length;

        // цикл до конца
        while( i-- ) {

            // если запрошенный путь соответствует какому-либо
            // маршруту, смотрим есть ли маршруты
            let args = path.match(this._routes[i].pattern);
            // если есть аргументы
            if( args ) {
                // вызываем обработчик из объекта, передавая ему аргументы
                // args.slice(1) отрезает всю найденную строку
                this._routes[i].callback.apply(this,args.slice(1));
                window.history.pushState({route: path}, "some title", '#'+path);
            }
        }
    },

    makeRequest: function(url = '', callback) {
        let preloader = document.querySelector('#preloader')
        preloader.classList.remove('hidden');

        let proxyUrl = 'https://cors-anywhere.herokuapp.com/',
            targetUrl = url

        fetch(proxyUrl + targetUrl)
            .then(blob => blob.json())
            .then(data => {
                preloader.classList.add('hidden');
                callback(data);
                return data;
            })
            .catch(e => {
                preloader.classList.add('hidden');
                alert(e);
                return e;
            });
    },

    index: function() {
        let context = this;

        this.makeRequest("http://my-json-server.typicode.com/dashalichman01/OKR-Lab4/products", function (data) {
            for (let item in data) {
                data[item].image = data[item].images[0];
            }
            context.showView("index", {items: data})
                .then(result => {
                    setHandlerToLinksRoute();
                    setHandlerToAddToCartButton();
                });
        });
    },

    catalogIndex: function() {
        let context = this;
        this.makeRequest("http://my-json-server.typicode.com/dashalichman01/OKR-Lab4/productsCategories", function (data) {
            context.showView("catalog", {items: data})
                .then(result => {
                    setHandlerToLinksRoute();
                });
        });
    },

    catalogShow: function(id) {
        let context = this;
        this.makeRequest("http://my-json-server.typicode.com/dashalichman01/OKR-Lab4/productsCategories/"+id, function (data) {
            context.showView("catalogShow", {items: [data]});
        });
    },

    productShow: function(id) {
        let context = this;
        this.makeRequest("http://my-json-server.typicode.com/dashalichman01/OKR-Lab4/products/"+id, function (data) {
            context.showView("productShow", {items: [data]});
        });
    },

    actionIndex: function() {
        let context = this;

        this.makeRequest("http://my-json-server.typicode.com/dashalichman01/OKR-Lab4/actions", function (data) {
            context.showView("actions", {items: data})
                .then(result => {
                    setHandlerToLinksRoute();
                });;
        });
    },

    actionShow: function(id) {
        let context = this;

        this.makeRequest("http://my-json-server.typicode.com/dashalichman01/OKR-Lab4/actions/"+id, function (data) {
            context.showView("actions", {items: [data]});
        });
    },

    cartShow: function() {
        let context = this;

        this.makeRequest("http://my-json-server.typicode.com/dashalichman01/OKR-Lab4/products", function (data) {
            let cart = Cart.getCart();

            for (let item in data) {
                data[item].image = data[item].images[0];
                data[item].totalPrice = 0;

                for(let key of Object.keys(cart)) {
                    if(cart.hasOwnProperty(key)) {
                        if(data[item]['id'] == key) {
                            data[item].totalPrice = cart[key] * data[item].price;
                        }
                    }
                }

                data[item]['count'] = +data[item].totalPrice / +data[item].price;

                if(data[item].totalPrice == 0) {
                    delete data[item];
                }
            }
            context.showView("cart", {items: data})
                .then(result => {
                    setHandlerToLinksRoute();
                    setHandlerToAddToCartButton();
                });
        });
    },

    orderIndex: function() {
        this.showView("index");
    },

    orderShow: function() {
        this.showView("index");
    },
}