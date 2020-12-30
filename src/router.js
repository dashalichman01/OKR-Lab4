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

    // метод проходиться по массиву routes и создает
    // создает объект на каждый маршрут
    init: function() {
        // объявляем свойство _routes
        this._routes = [];
        for( let route in this.routes ) {

            // имя метода-обрботчика
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
        let flag = false;

        // цикл до конца
        while( i-- ) {

            // если запрошенный путь соответствует какому-либо
            // маршруту, смотрим есть ли маршруты
            let args = path.match(this._routes[i].pattern);
            // если есть аргументы
            if( args ) {
                flag = true;
                // вызываем обработчик из объекта, передавая ему аргументы
                // args.slice(1) отрезает всю найденную строку
                this._routes[i].callback.apply(this,args.slice(1));
                window.history.pushState({route: path}, "some title", '#'+path);
            }
        }
        if(!flag) {
            this._routes[0].callback.apply(this);
            window.history.pushState({route: '/'}, "some title", '#'+'/');
        }
    },

    createOrder: function (params) {
        let formBody = [];
        for (let property in params) {
            let encodedKey = encodeURIComponent(property);
            let encodedValue = encodeURIComponent(params[property]);
            formBody.push(encodedKey + "=" + encodedValue);
        }

        formBody = formBody.join("&");

        let request = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            body: formBody
        };

        fetch("https://my-json-server.typicode.com/dashalichman01/OKR-Lab4/orders", request)
            .then(response => response.json())
            .then(data => console.log(data));
    },

    makeRequest: function(url = '', callback) {
        let preloader = document.querySelector('#preloader')
        preloader.classList.remove('hidden');

        let proxyUrl = 'http://my-json-server.typicode.com/dashalichman01/OKR-Lab4/',
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

        this.makeRequest("products", function (data) {
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
        this.makeRequest("productsCategories", function (data) {
            context.showView("catalog", {items: data})
                .then(result => {
                    setHandlerToLinksRoute();
                });
        });
    },

    catalogShow: function(id) {
        let context = this;
        this.makeRequest("productsCategories/"+id, function (data) {
            let products = context.makeRequest("products", function (products) {
                for(let i in products) {
                    if(data['id'] == products[i]['categoryId']) {
                        products[i]['image'] = products[i]['images'][0];
                        if(!data.hasOwnProperty("products")) {
                            data['products'] = [];
                        }
                        data['products'].push(products[i]);
                    }
                }
                context.showView("catalogShow", {items: [data]}).then(() => {
                    setHandlerToAddToCartButton();
                });
            });
        });
    },

    productShow: function(id) {
        let context = this;
        this.makeRequest("products/"+id, function (data) {
            context.showView("productShow", {items: [data]});
        });
    },

    actionIndex: function() {
        let context = this;

        this.makeRequest("actions", function (data) {
            context.showView("actions", {items: data})
                .then(result => {
                    setHandlerToLinksRoute();
                });;
        });
    },

    actionShow: function(id) {
        let context = this;

        this.makeRequest("actions/"+id, function (data) {
            context.showView("actions", {items: [data]});
        });
    },

    cartShow: function() {
        let context = this;

        this.makeRequest("products", function (data) {
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
                    document.querySelector("#createOrder").addEventListener('click', function (e) {
                        window.localStorage.removeItem("cart");
                        context.createOrder(
                            {}
                        );

                    })
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
