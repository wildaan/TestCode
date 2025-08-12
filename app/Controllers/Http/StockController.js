const DB = use("Database");
const ApiController = use("App/Controllers/Http/ApiController");

class StockController extends ApiController {
    async list({request,response}){
        if (!(await this.startProcess({ request, response }, "get"))) {
            return;
        }
        const query = await DB.table('public.stock').select();
        this.finalProcess({
            response : query
        })
    }

    async details({request,response}){
        if (!(await this.startProcess({ request, response }, "get"))) {
            return;
        }

        const id = this.param['id'] ? this.param['id'] : null;
        const data = await DB.table('public.stock').where('id',id).first();
        this.finalProcess({
            response : data
        })
    }

    async create({request,response}){
        if (!(await this.startProcess({ request, response }, "post"))) {
            return;
        }

        const name = this.param['name'] ? this.param['name'] : null;
        const price = this.param['price'] ? this.param['price'] : null;
        const stock = this.param['stock'] ? this.param['stock'] : null;
        
        if(name == null || price == null || stock == null){
            return breakProcess('Semua field harus disii');
        }
        const data = {
            name : name,
            price : price,
            stock : stock
        };
        const query = await DB.table('public.stock').insert(data);
        let message = null
        if(query){
            message = "data berhasil di simpan"
        }else{
            message = "data gagal disimpan"
        }
        this.finalProcess({
            response : message
        })
    }

    async update({request,response}){
        if (!(await this.startProcess({ request, response }, "post"))) {
            return;
        }

        const name = this.param['name'] ? this.param['name'] : null;
        const price = this.param['price'] ? this.param['price'] : null;
        const stock = this.param['stock'] ? this.param['stock'] : null;
        const id = this.param['id'] ? this.param['id'] : null;
        if(name == null || price == null || stock == null){
            return breakProcess('Semua field harus disii');
        }
        const data = {
            name : name,
            price : price,
            stock : stock
        };
        const query = await DB.table('public.stock').update(data).where('id',id);
        let message = null
        if(query){
            message = "data berhasil di update"
        }else{
            message = "data gagal di update"
        }
        this.finalProcess({
            response : message
        })
    }    

    async delete({request,response}){
        if (!(await this.startProcess({ request, response }, "post"))) {
            return;
        }

        const id = this.param['id'] ? this.param['id'] : null;
        const data = await DB.table('public.stock').where('id',id).first();
        if(!data){
            return breakProcess('data tidak ditemukan')
        }
        await DB.table('public.stock').where('id',id).delete();
        this.finalProcess({
            response : "data berhasil dihapus"
        })
    }

    async refactor({request,response}){
        if (!(await this.startProcess({ request, response }, "post"))) {
            return;
        }
        const p = this.param['p'] ? this.param['p'] : null
        const t = this.param['t'] ? this.param['t'] : null;

        const value = this.param['value'] ? this.param['value'] : null;

        const selectedValue = {
            GOLD : p *  0.8,
            SILVER : p * 0.9
        }
        const data = selectedValue[value]
        this.finalProcess({
            response : data
        })
    }

    async combinantion({request,response}){
        if (!(await this.startProcess({ request, response }, "get"))) {
            return;
        }
        const input = [1,2,3,4,5]
        const target = 6
        const set = new Set();
        const find = []

        for(let number of input){
            const elementdata = target - number;
            if(set.has(elementdata)){
                find.push([elementdata,number])
            }
            set.add(number)
        }
        this.finalProcess({
            response : find
        })
        //output [[1,5],[2,4]]
    }
}
module.exports = StockController;