import axios from 'axios';
import {Message} from 'element-ui';
import router from "../routes/router";

const BASE_URL = process.env.VUE_APP_API_URL;

let defaultConfig = {
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
        'Accept': 'application/json',
        // 'Authorization': '',
        // 'locale': ''
    },
};
let instance = axios.create(defaultConfig);

function handleError(error, vm) {
    //是否传递了vue实例
    if (vm) {
        vm.loading = false;
    }
    if (axios.isCancel(error)) { // 如果是用户主动取消的
        return;
    }
    if (error.response) { // 服务器错误
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx

        if (error.response.status === 401) {
            if (localStorage.getItem('role') === 'company') {
                localStorage.removeItem('COMPANY_TOKEN');
                router.push({path: `/company-login`});
            }
            if (localStorage.getItem('role') === 'bank') {
                localStorage.removeItem('CONTACT_TOKEN');
                router.push({path: `/bank-login`});
            }
            if (localStorage.getItem('role') === 'manager') {
                localStorage.removeItem('MANAGER_TOKEN');
                router.push({path: `/bank-login`});
            }
            return;
        }
        if (error.response.status === 429) {
            Message({
                message: '短信发送过于频繁',
                type: 'error',
                offset: 350,
                duration: 1800
            });
            return;
        }
        if (error.response.status === 422) {
            Message({
                message: error.response.data.message || error.response.data.msg,
                type: 'error',
                offset: 350,
                duration: 1800
            });
            return
        }
        if (error.response.status === 400) {
            Message({
                message: error.response.data.message,
                type: 'error',
                offset: 350,
                duration: 1800
            });
            return
        }
        if (error.response.status === 404) {
            Message({
                message: '404 page not found',
                type: 'error',
                offset: 350,
                duration: 1800
            });
            return
        }
        Message({
            message: error.response.data.error || '服务端错误',
            type: 'error',
            offset: 350,
            duration: 1800
        });
    } else if (error.request) {
        Message({
            message: '请求失败',
            type: 'error',
            offset: 350,
            duration: 1800
        });
    } else {
        Message({
            message: '请求失败',
            type: 'error',
            offset: 350,
            duration: 1800
        });
    }
}

// create an axios instance
instance.interceptors.request.use(
    config => {
        // 在发送请求之前做什么
        config.url = BASE_URL + config.url;
        return config;
    },
    error => {
    });

const http = {
    getBaseURL: () => {
        return defaultConfig.baseURL;
    },
    request: (params, type) => {
        if (!params || Object.prototype.toString.call(params) !== "[object Object]") {
            throw new Error("params is undefined or not an object")
        }
        //设置私有接口Authorization
        if (params.authApi) {
            const USER_TOKEN = getRoleToken();
            let token  = localStorage.getItem(USER_TOKEN);
            instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete instance.defaults.headers.common['Authorization'];
        }

        return new Promise((resolve, reject) => {
            instance.request(params).then(res => {
                if (res.status === 200) {
                    resolve(res.data);
                } else {
                    handleError(res, params.vm);
                    throw reject(res);
                }
            }).catch(error => {
                handleError(error, params.vm);
                throw reject(error);
            });
        });
    },
    getConfig: (method, url, data, config) => {
        let params = {
            url: url,
            method: method
        };
        if (method === 'get') {
            data && (params.params = data);
        } else {
            data && (params.data = data);
        }
        //没有传递authApi参数都是私有接口
        if (!config) {
            config = {};
            config.authApi = true;
        }
        if (config && !config.hasOwnProperty('authApi')) config.authApi = true;
        config && Object.assign(params, config);
        return params;
    },
    get: (url, data, config) => {
        let params = http.getConfig('get', url, data, config);
        return http.request(params);
    },
    post: (url, data ,config) => {
        let params = http.getConfig('post', url, data, config);
        return http.request(params);
    },
    put: (url, data ,config) => {
        let params = http.getConfig('put', url, data, config);
        return http.request(params);
    },
};

export default http;
