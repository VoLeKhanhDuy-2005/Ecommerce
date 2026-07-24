import { notification, Table } from "antd";
import { useEffect, useState } from "react";
import { getUserApi } from "../../util/api";
import { TeamOutlined } from "@ant-design/icons";

const UserPage = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const res = await getUserApi();
      if (!res?.message) {
        setDataSource(res);
      } else {
        notification.error({
          message: "Unauthorized",
          description: res.message,
        });
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const columns = [
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Tên",
      dataIndex: "name",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
    },
    {
      title: "Điện thoại",
      dataIndex: "phone",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-gradient-to-b from-purple-600 to-indigo-600 rounded-full" />
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <TeamOutlined className="text-purple-600" />
            <span>Quản Lý Người Dùng</span>
          </h1>
        </div>
      </div>
      <Table
        bordered
        dataSource={dataSource}
        columns={columns}
        rowKey={"_id"}
        loading={loading}
        pagination={{ pageSize: 6 }}
        className="bg-white rounded-lg shadow-sm"
      />
    </div>
  );
};

export default UserPage;
