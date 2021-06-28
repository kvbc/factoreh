const e_src = document.getElementById("src");
const e_inp = document.getElementById("input");
const e_out = document.getElementById("out");
const e_new = document.getElementById("new");
const e_step = document.getElementById("step");

class Interpreter
{
    src = '';
    inpi = 0; // input iterator
    nums = [];
    inputs = [];
    getters = [];
    i = 0;

    constructor(src)
    {
        this.src = src.split('\n').map(e => e.split(''));
    }

    set_inputs()
    {
        for(let i = 0; i < this.src[0].length; i++)
            if(this.src[0][i] == '|')
                for(let j = 1; j < this.src.length;)
                    if(this.src[j][i] == '|')
                        j++;
                    else if(this.src[j][i] == 'V')
                    {
                        this.inputs.push({x:i, y:j});
                        break;
                    }
                    else break;
    }

    set_getters()
    {
        for(let y = 0; y < this.src.length; y++)
            for(let x = 0; x < this.src[y].length; x++)
                if(this.src[y][x]=='>' || this.src[y][x]=='<')
                    for(let i = y+1; i < this.src.length;)
                        if(this.src[i][x] == '|')
                            i++;
                        else if(this.src[i][x] == 'V')
                        {
                            this.getters.push({x:x, y:i, ty:y, m:this.src[y][x]});
                            let l1 = this.src[y].length;
                            let l2 = this.src[y+1].length;
                            let l3 = this.src[y+2].length;
                            if(l1 > l2)
                                for(var j = 0; j < (l1 - l2); j++)
                                    this.src[y+1].push(' ');
                            if(l1 > l3)
                                for(var j = 0; j < (l1 - l3); j++)
                                    this.src[y+2].push(' ');
                            break;
                        }
                        else break;
    }

    get_input()
    {
        if(this.inpi < e_inp.value.length)
        {
            let i = this.inputs[this.inpi % this.inputs.length];
            let n = {x: i.x, y: i.y, v:e_inp.value[this.inpi]};
            this.nums.push(n);
            this.inpi++;
        }
    }

    push_num(x,y,v,m)
    {
        this.nums.push({x:x,y:y,v:v,m:m});
    }

    release_num(a,b,x,y,op,m)
    {
        let v = [a+b,a-b,a%b,a/b,a*b,a&b,a^b,a|b][op];
        this.push_num(x,y,v,m);
    }

    release_num_xy(a,b,x,y,nx,ny,m)
    {
        this.release_num(a, b, x, y, '+-%/*&^|'.indexOf(this.src[ny][nx]), m);
    }

    delete_num_idx(i)
    {
        this.nums.splice(i, 1);
        this.i--;
    }

    delete_num_xy(x,y)
    {
        this.delete_num_idx(this.nums.findIndex(e => e.x==x && e.y==y));
    }

    checkoperand(i)
    {
        let n = this.nums[this.i];
        let b = this.out[n.y+1][n.x-3];
        if(b>='0' && b<='9')
        {
            this.release_num_xy(+b, +n.v, n.x+2, n.y+1, n.x, n.y+1, 1);
            this.delete_num_xy(n.x-3, n.y+1);
            n.m = 3;
        }
    }

    step()
    {
        this.get_input();
        let s = this.src;
        let o = this.out = s.slice(0).map(e => e.slice(0));
        for(this.i = 0; this.i < this.nums.length; this.i++)
        {
            let n = this.nums[this.i];
            switch(n.m)
            {
            case 0:
            case undefined:
                if(!s[++n.y])
                    o[n.y] = new Array(n.x+1);
                if(o[n.y][n.x] == '_')
                    if(o[n.y+1] && '+-%/*&^|'.includes(o[n.y+1][n.x]))
                    {
                        n.m = 2;
                        this.checkoperand();
                    }
                    else n.m = 1;
                for(let x=0; x<n.x; x++)
                    if(!o[n.y][x])
                        o[n.y][x] = ' ';
                break;
            case 1:
                let g = n.g;
                if(!g && (g = this.getters.find(e => e.x==n.x && e.y==n.y-1)))
                {
                    n.g = g;
                    n.gx = g.x;
                    n.y = g.ty + 2;
                    n.gm = (g.m == '>') ? 1 : -1;
                }
                if(g)
                {
                    if(s[g.ty][n.gx+n.gm] != '_')
                    {
                        n.m = 0;
                        n.g = 0;
                        break;
                    }
                    o[g.ty+1][n.gx+=n.gm] = 'V';
                    n.x += n.gm;
                    break;
                }
                let by = ((s[n.y+1][n.x] == '<') ? -1 : 1);
                let b = s[n.y][n.x+by];
                if(b=='/')
                {
                    this.push_num(n.x+5, n.y, n.v, 1);
                    this.push_num(n.x+3, n.y, n.v, 0);
                    this.delete_num_xy(n.x, n.y);
                }
                else if(b=='|')
                {
                    b = s[n.y-1][n.x+3];
                    if(b>='0' && b<='9')
                    {
                        this.release_num_xy(b-'0', n.v-'0', n.x+5, n.y, n.x+3, n.y, 1);
                        this.delete_num_idx(this.i);
                        continue;
                    }
                }
                else n.x += by;
                if(s[n.y][n.x] != '_')
                    n.m = 0;
                break;
            case 2:
                this.checkoperand();
                break;
            case 3:
                this.delete_num_idx(this.i);
                continue;
            }
            o[n.y][n.x] = n.v;
        }
        e_out.value = o.map(e => e.join('')).join('\n');
    }

    init()
    {
        this.set_inputs();
        this.set_getters();
    }
}

var inp;

e_new.addEventListener("click", e =>
{
    inp = new Interpreter(e_src.value);
    inp.init();
});

e_step.addEventListener("click", e =>
{
    inp.step();
});