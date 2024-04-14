const baseUrl = "http://localhost:5000";

const clientIo = io(baseUrl);

// Send Data to Backend
// clientIo.emit("requestAllData");

let allProducts = [];

// Listen Data from Backend
// clientIo.on("returnProducts", (data) => {
//   allProducts = data.products;
//   displayData(allProducts);
// });

displayData();

// ==================== Add Product Data =================

$(".createProduct").click(async() => {
  const data = {
    title: $(".title").val(),
    desc: $(".desc").val(),
    stock: $(".stock").val(),
    price: $(".price").val(),
    appliedDiscount: $(".appliedDiscount").val(),
    categoryId: $(".categoryId").val(),
    subCategoryId: $(".subCategoryId").val(),
    brandId: $(".brandId").val(),
    // createdBy: $(".createdBy").val(),
  };

  // Add Product with Axios
await axios({
  method:'POST',
  url:`${baseUrl}/product/add`,
  data:data
})

  // Send Product Data to Backend with SocketIO
  // clientIo.emit("addProduct", data);
});

// Listen Data and messege from Backend
clientIo.on("addedDone", (data) => {
  // console.log(allProducts);
  // allProducts.push(data.product);
  displayData(allProducts);
});

async function displayData() {
  //======================= Get All Data by Axios =================
  await axios({
    method: "GET",
    url: `${baseUrl}/product/search`,
  }).then((res) => {
    console.log(res);
    let cartoona = ``;
    for (const product of res.data.products) {
      cartoona += `<div class="col-md-4 my-2">
                  <div class="p-2 border border-success">
                    <h3>${product.title}</h3>
                    <p>${product.desc}</p>
                    <h3>${product.price}</h3>
                  </div>
                </div>`;
    }
    document.getElementById("rowData").innerHTML = cartoona;
  });
}
