const request = require("supertest")
const app = require("../app")
const { User, Product } = require("../models")
const { generateToken } = require("../helpers/jwt")
const { clearProduct } = require("../helpers/clearAll")


let access_token_admin
let access_token_notAdmin

let inputProduct = {
  name: "Monster Hunter World",
  imageUrl: "https://www.monsterhunterworld.com/sp/images/top/bg_mv.jpg",
  price: 699999,
  stock: 100,
  genre: "adventure",
}
let productId

beforeAll(done => {
  User.findOne({
    where: { email: "admin@mail.com" }
  })
    .then(data => {
      access_token_admin = generateToken({
        id: data.id, email: data.email, role: data.role
      })
      return User.findOne({
        where: { email: "notAdmin@mail.com" }
      })
    })
    .then(data => {
      access_token_notAdmin = generateToken({
        id: data.id, email: data.email, role: data.role
      })
      return Product.create(inputProduct)
    })
    .then(data => {
      productId = data.id
      done()
    })
    .catch(err => {
      done()
    })
})

// afterAll((done) => {
//   clearProduct()
//     .then(() => {
//       done()
//     })
//     .catch(console.log)
// });

describe("POST/products", function () {
  afterAll((done) => {
    clearProduct()
      .then(() => {
        done()
      })
      .catch(console.log)
  });

  describe("POST success", () => {
    it("should send response with 201 status code", function (done) {
      //Setup
      const body = inputProduct
      //Execute
      request(app)
        .post("/products")
        .set("access_token", access_token_admin)
        .send(body)
        .end(function (err, res) {
          if (err) done(err)

          //Assert
          expect(res.statusCode).toEqual(201)
          expect(typeof res.body).toEqual("object")
          expect(res.body).toHaveProperty("name")
          expect(res.body.name).toEqual(body.name)
          expect(res.body).toHaveProperty("imageUrl")
          expect(res.body.imageUrl).toEqual(body.imageUrl)
          expect(res.body).toHaveProperty("price")
          expect(res.body.price).toEqual(body.price)
          expect(res.body).toHaveProperty("stock")
          expect(res.body.stock).toEqual(body.stock)
          expect(res.body).toHaveProperty("genre")
          expect(res.body.genre).toEqual(body.genre)

          done()
        })
    })
  })

  describe("Empty access_token", () => {
    it("should send response with 401 status code", function (done) {
      //Setup
      const body = inputProduct
      //Execute
      request(app)
        .post("/products")
        .set("access_token", ""  )
        .send(body)
        .end(function (err, res) {
          if (err) done(err)

          //Assert
          expect(res.statusCode).toEqual(401)
          expect(typeof res.body).toEqual("object")
          expect(res.body).toHaveProperty("message")
          expect(res.body).toEqual(
            expect.objectContaining({ message: "Please login first" })
          )

          done()
        })
    })
  })

  describe("access_token not belong to admin", () => {
    it('should send response with status code 401', (done) => {
      const body = inputProduct

      request(app)
        .post("/products")
        .set("access_token", access_token_notAdmin)
        .send(body)
        .end((err, res) => {
          if (err) done(err)

          expect(res.statusCode).toEqual(401);
          expect(typeof res.body).toEqual("object");
          expect(res.body).toHaveProperty("message", "You're unauthorized to do this");

          done()
        })
    });
  })

  describe("Required name field must not empty", () => {
    it("should send response with 400 status code", (done) => {
      //Setup
      const body = {
        name: "",
        imageUrl: "https://www.monsterhunterworld.com/sp/images/top/bg_mv.jpg",
        price: 699999,
        stock: 100,
        genre: "adventure",
      }
      //Execute
      request(app)
        .post("/products")
        .set("access_token", access_token_admin)
        .send(body)
        .end((err, res) => {
          if (err) done(err)

          //Assert
          expect(res.statusCode).toEqual(400)
          expect(typeof res.body).toEqual("object")
          expect(res.body).toHaveProperty("errors")
          expect(Array.isArray(res.body.errors)).toEqual(true)
          expect(res.body.errors).toEqual(
            expect.arrayContaining(["Name is required"])
          );

          done()
        })
    })
  })

  describe('Required imageUrl must not empty', () => {
    it('should send response with 400 status code', (done) => {
      const body = {
        name: "Monster Hunter World",
        imageUrl: "",
        price: 699999,
        stock: 100,
        genre: "adventure",
      }
      //Execute
      request(app)
        .post("/products")
        .set("access_token", access_token_admin)
        .send(body)
        .end((err, res) => {
          if (err) done(err)

          expect(res.statusCode).toEqual(400);
          expect(typeof res.body).toEqual("object");
          expect(res.body).toHaveProperty("errors");
          expect(Array.isArray(res.body.errors)).toEqual(true);
          expect(res.body.errors).toEqual(
            expect.arrayContaining(["Image URL is required"])
          );

          done()
        })
    });
  });

  describe('Required price must not empty', () => {
    it('should send response with 400 status code', (done) => {
      //Setup
      const body = {
        name: "Monster Hunter World",
        imageUrl: "https://www.monsterhunterworld.com/sp/images/top/bg_mv.jpg",
        price: "",
        stock: 100,
        genre: "adventure",
      }
      //Execute
      request(app)
        .post("/products")
        .set("access_token", access_token_admin)
        .send(body)
        .end((err, res) => {
          if (err) done(err)

          //Assert
          expect(res.statusCode).toEqual(400);
          expect(typeof res.body).toEqual("object");
          expect(res.body).toHaveProperty("errors");
          expect(Array.isArray(res.body.errors)).toEqual(true);
          expect(res.body.errors).toEqual(
            expect.arrayContaining(["Price is required"])
          );

          done()
        })
    });
  });

  describe('Price must be greater than zero', () => {
    it('should send response with status code 400', (done) => {
      //Setup
      const body = {
        name: "Monster Hunter World",
        imageUrl: "https://www.monsterhunterworld.com/sp/images/top/bg_mv.jpg",
        price: 0,
        stock: 100,
        genre: "adventure",
      }
      //Execute
      request(app)
        .post("/products")
        .set("access_token", access_token_admin)
        .send(body)
        .end((err, res) => {
          if(err) done(err)
          //Assert
          expect(res.statusCode).toEqual(400);
          expect(typeof res.body).toEqual("object");
          expect(res.body).toHaveProperty("errors");
          expect(Array.isArray(res.body.errors)).toEqual(true);
          expect(res.body.errors).toEqual(
            expect.arrayContaining(["Price must be greater than zero"])
          );
  
          done()
        })
    });
  });

  describe('Price must be greater than zero', () => {
    it('should send response with status code 400', (done) => {
      //Setup
      const body = {
        name: "Monster Hunter World",
        imageUrl: "https://www.monsterhunterworld.com/sp/images/top/bg_mv.jpg",
        price: -200,
        stock: 100,
        genre: "adventure",
      }
      request(app)
        .post("/products")
        .set("access_token", access_token_admin)
        .send(body)
        .end((err, res) => {
          if(err) done(err)
  
          expect(res.statusCode).toEqual(400);
          expect(typeof res.body).toEqual("object");
          expect(res.body).toHaveProperty("errors");
          expect(Array.isArray(res.body.errors)).toEqual(true);
          expect(res.body.errors).toEqual(
            expect.arrayContaining(["Price must be greater than zero"])
          );
  
          done()
        })
    });
  });

  describe('Stock must not be less than zero', () => {
    it('should send response with 400 status code', (done) => {
      //setup
      const body = {
        name: "Monster Hunter World",
        imageUrl: "https://www.monsterhunterworld.com/sp/images/top/bg_mv.jpg",
        price: 699999,
        stock: -20,
        genre: "adventure",
      }
      //execute
      request(app)
        .post("/products")
        .set("access_token", access_token_admin)
        .send(body)
        .end((err, res) => {
          if(err) done(err)

          expect(res.statusCode).toEqual(400);
          expect(typeof res.body).toEqual("object");
          expect(res.body).toHaveProperty("errors")
          expect(Array.isArray(res.body.errors)).toEqual(true);
          expect(res.body.errors).toEqual(
            expect.arrayContaining(["Stock must not be less than zero"])
          );

          done()
        })
    });
  });

  describe('Required genre field must not empty', () => {
    it('should send response with 400 status code', (done) => {
      const body = {
        name: "Monster Hunter World",
        imageUrl: "https://www.monsterhunterworld.com/sp/images/top/bg_mv.jpg",
        price: 699999,
        stock: 200,
        genre: "",
      }
      //exec
      request(app)
        .post("/products")
        .set("access_token", access_token_admin)
        .send(body)
        .end((err, res) => {
          if (err) done(err)

          //assert
          expect(res.statusCode).toEqual(400);
          expect(typeof res.body).toEqual("object");
          expect(res.body).toHaveProperty("errors");
          expect(Array.isArray(res.body.errors)).toEqual(true);
          expect(res.body.errors).toEqual(
            expect.arrayContaining(["Genre is required"])
          );

          done()
        })
    });
  });

  describe('Data type must be same as required data type', () => {
    it('should send response with 400 status code', (done) => {
      const body = {
        name: 100,
        imageUrl: 100,
        price: "hundred",
        stock: "hundred",
        genre: 200,
      }
      //exec
      request(app)
        .post("/products")
        .set("access_token", access_token_admin)
        .send(body)
        .end((err, res) => {
          if (err) done(err)

          //assert
          expect(res.statusCode).toEqual(400);
          expect(typeof res.body).toEqual("object");
          expect(res.body).toHaveProperty("errors");
          expect(Array.isArray(res.body.errors)).toEqual(true);
          expect(res.body.errors).toEqual(
            expect.arrayContaining(["Name must be string", "Image URL must be string", "Price must be integer",
            "Stock must be integer", "Genre must be string"])
          );

          done()
        })
    });
  });

})