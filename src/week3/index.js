

const PRODUCT_URL = "https://dummyjson.com/products"


//function getProduct(url) {
  //  fetch(url)
    //    .then(res => res.json())
      // .then(data => {
       //     console.log(data)
        //})
        //.catch((error) => {
          //  console.log(error)
        //})
//}

async function getProduct(url){
    try{
        const response = await fetch(url);
        const data = await response.json();
        console.log(data);
    } catch (error){
        console.log(error);
    }
}
getProduct(PRODUCT_URL);