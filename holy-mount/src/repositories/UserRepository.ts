import { Collection, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { dbManager } from "@/lib/database";
import { User, CreateUserDto, UpdateUserDto, UserResponse } from "@/types/user";

export class UserRepository {
  private async getCollection(): Promise<Collection<User>> {
    const db = await dbManager.connect();
    return db.collection<User>("users");
  }

  private userToResponse(user: User): UserResponse {
    return {
      _id: user._id!.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      level: user.level,
      progress: user.progress,
      studyDays: user.studyDays,
      wordsLearned: user.wordsLearned,
      avatar: user.avatar,
      isActive: user.isActive,
    };
  }

  async createUser(userData: CreateUserDto): Promise<UserResponse> {
    const collection = await this.getCollection();

    // 检查用户是否已存在
    const existingUser = await collection.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error("该邮箱已被注册");
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // 创建用户对象
    const newUser: Omit<User, "_id"> = {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      level: "初级",
      progress: 0,
      studyDays: 0,
      wordsLearned: 0,
      isActive: true,
    };

    const result = await collection.insertOne(newUser as User);
    const user = await collection.findOne({ _id: result.insertedId });
    
    if (!user) {
      throw new Error("创建用户失败");
    }

    return this.userToResponse(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const collection = await this.getCollection();
    return await collection.findOne({ email });
  }

  async findById(id: string): Promise<UserResponse | null> {
    const collection = await this.getCollection();
    const user = await collection.findOne({ _id: new ObjectId(id) });
    return user ? this.userToResponse(user) : null;
  }

  async updateUser(id: string, updateData: UpdateUserDto): Promise<UserResponse | null> {
    const collection = await this.getCollection();
    
    const updateDoc = {
      ...updateData,
      updatedAt: new Date(),
    };

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateDoc },
      { returnDocument: "after" }
    );

    return result ? this.userToResponse(result) : null;
  }

  async validatePassword(email: string, password: string): Promise<UserResponse | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return this.userToResponse(user);
  }

  async incrementStudyDay(id: string): Promise<UserResponse | null> {
    const collection = await this.getCollection();
    
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $inc: { studyDays: 1 },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: "after" }
    );

    return result ? this.userToResponse(result) : null;
  }

  async updateProgress(id: string, progress: number): Promise<UserResponse | null> {
    const collection = await this.getCollection();
    
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          progress: Math.max(0, Math.min(100, progress)), // 确保进度在0-100之间
          updatedAt: new Date() 
        }
      },
      { returnDocument: "after" }
    );

    return result ? this.userToResponse(result) : null;
  }

  async addWordsLearned(id: string, count: number): Promise<UserResponse | null> {
    const collection = await this.getCollection();
    
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $inc: { wordsLearned: count },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: "after" }
    );

    return result ? this.userToResponse(result) : null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }
}