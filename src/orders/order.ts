import { AxiosInstance } from "axios";
import Resource, {fromJSON as resourceFromJSON} from "./resource";

const getURL = "https://api.arlula.com/api/order/get";

export function fromJSON(client: AxiosInstance, json: string|{[key: string]: unknown}): Order|string {
    if (typeof json === "string") {
        json = JSON.parse(json);
    }

    if (!(json instanceof Object)) {
        return "JSON does not correspond to an Order object";
    }

    if (typeof json.id !== "string") {
        return "No ID for order";
    }
    if (typeof json.createdAt !== "string") {
        return "No creation date for order";
    }
    if (typeof json.updatedAt !== "string") {
        return "No update date for order";
    }
    if (typeof json.supplier !== "string") {
        return "Order supplier missing";
    }
    if (typeof json.imageryID !== "string") {
        return "Imagery ID missing from Order";
    }
    if (typeof json.sceneID !== "string") {
        return "Scene ID missing form Order";
    }
    if (typeof json.status !== "string") {
        return "Order status missing";
    }
    if (!isOrderStatus(json.status)) {
        return `Order status '${json.status}' not recognized`;
    }
    if (typeof json.total !== "number") {
        return "Order total missing";
    }
    if (typeof json.type !== "string") {
        return "Order type missing";
    }
    if (json.expiration && !(typeof json.expiration === "string" || json.expiration instanceof Date)) {
        return "Order Expiration invalid formatting";
    }

    const resources: Resource[] = [];
    if (json.resources && Array.isArray(json.resources)) {
        for (let i=0; i<json.resources.length; i++) {
            const res = resourceFromJSON(client, json.resources[i]);
            if (res instanceof Resource) {
                resources.push(res);
                continue;
            }
            return res;
        }
    }

    return new Order(client, json.id, new Date(json.createdAt), new Date(json.updatedAt), json.supplier, json.imageryID, json.sceneID, json.status, json.total, json.type, resources, json.expiration?new Date(json.expiration as string|Date):undefined);
}

export default class Order {
    private _client: AxiosInstance;
    private _id: string;
    private _createdAt: Date;
    private _updatedAt: Date;
    private _supplier: string;
    private _imageryID: string;
    private _sceneID: string;
    private _status: OrderStatus;
    private _total: number;
    private _type: string;
    private _expiration?: Date;
    private _resources: Resource[] = [];
    private detailed = false;
    constructor(client: AxiosInstance, id: string, created: Date, updated: Date, supplier: string, imgID: string, scene: string, status: OrderStatus, total: number, type: string, resources: Resource[], exp?: Date) {
        this._client = client;
        this._id = id;
        this._createdAt = created;
        this._updatedAt = updated;
        this._supplier = supplier;
        this._imageryID = imgID;
        this._sceneID = scene;
        this._status = status;
        this._total = total;
        this._type = type;
        this._expiration = exp;
        this._resources = resources;
        if (this.resources.length) {
            this.detailed = true;
        }
    }

    // public getters

    public get id(): string {
        return this._id;
    }
    public get createdAt(): Date {
        return this._createdAt;
    }
    public get updatedAt(): Date {
        return this._updatedAt;
    }
    public get supplier(): string {
        return this._supplier;
    }
    public get imageryID(): string {
        return this._imageryID;
    }
    public get sceneID(): string {
        return this._sceneID;
    }
    public get status(): OrderStatus {
        return this._status;
    }
    public get total(): number {
        return this._total;
    }
    public get type(): string {
        return this._type;
    }
    public get expiration(): Date|null {
        if (this._expiration) {
            return this._expiration;
        }
        return null;
    }
    public get resources(): Resource[] {
        return this._resources;
    }

    loadResources(): Promise<Resource[]> {
        if (this.status !== OrderStatus.Complete) {
            return Promise.resolve(this._resources);
        }

        if (this.detailed) {
            return Promise.resolve(this._resources);
        }

        return this._client.get(getURL, {params: {id: this._id}})
        .then((resp) => {
            if (typeof resp.data !== "object") {
                return Promise.reject("Order response is not an object");
            }
            if (!("resources" in resp.data)) {
                // order has no resources
                this.detailed = true;
                return [];
            }
            
            if (!Array.isArray(resp.data.resources)) {
                return Promise.reject("Resources is not an array");
            }

            const resources: Resource[] = [];
            for (let i=0; i<resp.data.resources.length; i++) {
                const res = resourceFromJSON(this._client, resp.data.resources[i]);
                if (!(res instanceof Resource)) {
                    // error in decoding, pass error up the chain
                    return Promise.reject(res);
                }
                resources.push(res);
            }

            this.detailed = true;
            this._resources = resources;
            return resources;
        });
    }

}

export enum OrderStatus {
    New        = "created",
    Pending    = "pending",
    Manual     = "processing",
    Custom     = "manual",
    Processing = "post-processing",
    Complete   = "complete",
}

function isOrderStatus(token: string): token is OrderStatus {
    return Object.values(OrderStatus).includes(token as OrderStatus);
}
