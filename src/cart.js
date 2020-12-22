let Cart = {
    add: function (id, count) {
        let cart = this.getCart();

        if(cart.hasOwnProperty(id)) {
            cart[id] = cart[id] + count
        } else {
            cart[id] = count;
        }

        localStorage.setItem('cart', JSON.stringify(cart));
    },

    getTotalProducts: function () {
        let cart = this.getCart();
        let total = 0;

        for(let key of Object.keys(cart)) {
            if(cart.hasOwnProperty(key)) {
                total += +cart[key];
            }
        }

        return total;
    },

    setTotalProducts: function () {
        let total = this.getTotalProducts();
        // console.log(total);
        document.querySelector(".cartState").innerHTML = total;
    },

    getCart: function () {
        let cart = JSON.parse(localStorage.getItem('cart'));

        if(!cart) {
            localStorage.setItem('cart', JSON.stringify({}));
            cart = JSON.parse(localStorage.getItem('cart'));
        }

        return cart;
    }
}