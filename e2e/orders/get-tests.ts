import Arlula from "../../dist/index";
import Order, { OrderStatus } from "../../dist/orders/order";

import { orderID } from "../credentials";

export default function runOrderGetTests(client: Arlula): Promise<unknown> {

    return Promise.all([test1(client), test2(client), test3(client)]);
    
}

// get from list
function test1(client: Arlula) {
    return client.orders().list()
    .then((list) => {
        if (!list.length) {
            console.error("order get 1, failed to get list to check against");
            return;
        }
        let sub: Order = list[0];
        for (let i=0; i<list.length; i++) {
            if (list[i].status === OrderStatus.Complete && !list[i].expiration) {
                sub = list[i];
                break;
            }
        }
    
        if (sub.status !== OrderStatus.Complete || sub.expiration) {
            console.error("order get 1, no suitable orders found to get");
            return;
        }
    
        return sub.loadResources()
        .then((res) => {
            if (!res.length) {
                console.error("order get 1, get order resources returned empty array");
            }
        })
        .catch((e) => {
            console.error("order get 1, error getting order: ", e);
            return Promise.reject(e);
        });
    })
    .catch((e) => {
        console.error("order get 1, unexpected error getting order list: ", e);
        return Promise.reject(e)
    });
}


// get direct
function test2(client: Arlula) {
    return client.orders().get(orderID)
    .then((order) => {
        if (!order.id) {
            console.error("order get 2, got empty order");
            return Promise.reject("got empty order");
        }

        if (!order.resources.length) {
            console.error("order get 2, get order did not return resources");
            return Promise.reject("get order did not return resources");
        }
    })
    .catch((e) => {
        console.error("order get 2, unexpected error getting order: ", e);
    });
}

// get invalid ID
// changing version to 6 (invalid version) to invalidate ID
function test3(client: Arlula) {
    const id = `${orderID.substr(0,14)}6${orderID.substr(15)}`;
    return client.orders().get(id)
    .then((order) => {
        console.error("order get 3, got order from invalid ID: ", order);
        return Promise.reject();
    })
    .catch((e) => {
        if (typeof e !== "string") {
            console.error("order get 3, unexpected error object: ", e);
        }
        if (!e.startsWith("No permission to order")) {
            console.error("order get 3, unexpected error: ", e);
        }
        return Promise.reject(e);
    });
}
