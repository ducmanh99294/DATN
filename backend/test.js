const { MongoClient, ObjectId } = require("mongodb");

async function run() {
  const client = new MongoClient("mongodb+srv://nguyenducmanh1809:manh1234@cluster0.1ya4y.mongodb.net/Hospital?retryWrites=true&w=majority&appName=Cluster0");

  await client.connect();
  const db = client.db("Hospital");

  const docs = await db.collection("doctorprofiles").find({
    userId: { $type: "string" }
  }).toArray();

  for (const doc of docs) {
    await db.collection("doctorprofiles").updateOne(
      { _id: doc._id },
      {
        $set: {
          userId: new ObjectId(doc.userId)
        }
      }
    );
  }

  console.log("Done update!");
  await client.close();
}

run();