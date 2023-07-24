import {useLocation} from "react-router";
import {useEffect, useState} from "react";
import querystring from "query-string";

export const getFirst = (item: string | null | Array<string | null>)=>{
    if (!item){
        return ''
    }
    if (Array.isArray(item)){
        return item.length ? item[0] ? item[0]: '' : ''
    }
    return item || ''
}

type ParseQueryType = {
    url: string
    query?: any
    route?: string
    fragmentIdentifier?: string
}

export function parseQuery<T>(): ParseQueryType{
    const fullUrl= window.location.href;
    const query =  querystring.parseUrl(fullUrl, { parseFragmentIdentifier: true }) as ParseQueryType;
    if (query.fragmentIdentifier){
        const subQuery = querystring.parseUrl(query.fragmentIdentifier);
        Object.assign(query.query, subQuery.query);
        query.route = subQuery.url;
    }
    console.log('parseQuery', query)
    return query as {
        query: T,
        url: string
    }
}

/**
 * 解析route的参数
 */
export function useQuery<T>  (){
    const [query,setQuery] = useState<T>()

    const location = useLocation()

    const parseRouteQuery = ()=>{
        if (!location.search){
            return
        }
        const q = querystring.parse(location.search);
        setQuery(q as never)
    }


    useEffect(()=>{
        parseRouteQuery()
    },[location])

  useEffect(()=>{
      parseRouteQuery()
  },[])

    return query
}


export const cacheTo = (to='/')=>{
    localStorage.setItem('redirect_to', to)
}
export const getLastTo = (remove=false)=>{
    const to = localStorage.getItem(`redirect_to`);
    remove && localStorage.removeItem('redirect_to');
    return to ?? '/'
}