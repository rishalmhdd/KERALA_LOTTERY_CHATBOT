
import Complaint from "../models/Complaint.js";

export async function saveComplaint(data){
    return await Complaint.create(data)
}