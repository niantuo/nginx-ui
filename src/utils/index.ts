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

export function useQuery<T>  (){
    const [query,setQuery] = useState<T>()

    const location = useLocation()

  const parseQuery = ()=>{
      console.log('location', location.search)
    if (!location.search){
      setQuery(undefined)
      return
    }
    const query:querystring.ParsedQuery =  querystring.parse(location.search)
    if (!query.code){
      return;
    }
    const newQuery:any = {}
    Object.keys(query).forEach(k=>{
      newQuery[k] = getFirst(query[k])
    })
    setQuery(newQuery)
  }

    useEffect(()=>{
        parseQuery()
    },[location])

  useEffect(()=>{
    parseQuery()
  },[])

    return query
}
