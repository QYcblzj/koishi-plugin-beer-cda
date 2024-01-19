import { Context, Schema, segment } from 'koishi';
import axios from 'axios';

export const name = 'beer-cda';

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

export function apply(ctx: Context) {
  ctx.command('beer <name> [ingredient] [firstLetter] [alcoholic] [category] [glass]', '查询酒类信息')
  .option('ingredient', '-i <ingredient:string> 通过成分搜索')
  .option('firstLetter', '-f <letter:string> 酒水名称首字母搜索')
  .option('alcoholic', '-a <type:string> 酒精类型搜索')
  .option('category', '-c <category:string> 酒水类别搜索')
  .option('glass', '-g <glass:string> 杯型搜索')
  .action(async ({options}, name) => {
    let apiUrl = `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(name)}`;
    let filterParams = [];

    if (options.ingredient) {
      filterParams.push(`i=${encodeURIComponent(options.ingredient)}`);
    }
    
    if (options.firstLetter) {
      apiUrl = `https://www.thecocktaildb.com/api/json/v1/1/search.php?f=${encodeURIComponent(options.firstLetter)}`;
    } else if (options.alcoholic) {
      filterParams.push(`a=${encodeURIComponent(options.alcoholic)}`);
    } else if (options.category) {
      filterParams.push(`c=${encodeURIComponent(options.category)}`);
    } else if (options.glass) {
      filterParams.push(`g=${encodeURIComponent(options.glass)}`);
    }
    
    // 如果有过滤参数，则组合为一个filter-api的url
    if (filterParams.length > 0) {
      apiUrl = `https://www.thecocktaildb.com/api/json/v1/1/filter.php?${filterParams.join('&')}`;
    }

      try {
        const response = await axios.get(apiUrl);
        const drinks = response.data.drinks;

        if (!drinks) {
          return `没有找到与“${name}”相关的酒水信息。`;
        }

        // 构建返回信息，这里只返回了第一条信息，您可以根据需求进行调整
        const drink = drinks[0];
        const description = [
          `名称：${drink.strDrink}`,
          `类别：${drink.strCategory}`,
          `类型：${drink.strAlcoholic}`,
          `具体描述：${drink.strInstructions}`,
          drink.strDrinkThumb ? segment('image', { url: drink.strDrinkThumb }) : '',
        ].filter(Boolean).join('\n');

        return description;

      } catch (error) {
        if (axios.isAxiosError(error)) {
          // 如果错误是由于网络问题引起的
          if (!error.response) {
            // 通常是网络连接问题或请求未发送
            return '无法连接到酒水信息服务，请检查网络连接。';
          } else if (error.response.status === 401) {
            // API密钥问题等
            return '无法验证API访问权限，请确认API密钥是否正确。';
          } else {
            // 其他API调用问题
            return `查询酒水信息时遇到错误，服务返回状态码为：${error.response.status}`;
          }
        } else {
          // Axios以外的错误
          return '发生未知错误，请联系维护人员。';
        }
      }
    });
    ctx.command('beer-random', '获取随机酒水信息')
    .alias('br')
    .action(async () => {
      const response = await axios.get(
        `https://www.thecocktaildb.com/api/json/v1/1/random.php`
      );
      // 处理响应数据
      const randomCocktail = response.data.drinks[0];
      if (!randomCocktail) {
        return '无法获取随机酒水信息。';
      }
      // 返回随机酒水的详细信息
      return randomCocktail.strDrink + '\n' + randomCocktail.strInstructions;
    });
}